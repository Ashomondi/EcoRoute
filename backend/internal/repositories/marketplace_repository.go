package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

var ErrInsufficientStock = errors.New("insufficient stock")

type MarketplaceRepository struct {
	pool *pgxpool.Pool
}

func NewMarketplaceRepository(pool *pgxpool.Pool) *MarketplaceRepository {
	return &MarketplaceRepository{pool: pool}
}

func (r *MarketplaceRepository) CreateSellerProfile(ctx context.Context, s *models.SellerProfile) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO seller_profiles (user_id, name, description, logo_url, contact_phone, location, verified)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at`,
		s.UserID, s.Name, s.Description, s.LogoURL, s.ContactPhone, s.Location, s.Verified,
	).Scan(&s.ID, &s.CreatedAt)
}

func (r *MarketplaceRepository) GetSellerProfile(ctx context.Context, id string) (*models.SellerProfile, error) {
	s := &models.SellerProfile{}
	var logo sql.NullString
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, name, description, logo_url, contact_phone, location, verified, created_at
		 FROM seller_profiles WHERE id = $1`, id,
	).Scan(&s.ID, &s.UserID, &s.Name, &s.Description, &logo, &s.ContactPhone, &s.Location, &s.Verified, &s.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	s.LogoURL = logo.String
	return s, nil
}

func (r *MarketplaceRepository) GetSellerProfileByUser(ctx context.Context, userID string) (*models.SellerProfile, error) {
	s := &models.SellerProfile{}
	var logo sql.NullString
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, name, description, logo_url, contact_phone, location, verified, created_at
		 FROM seller_profiles WHERE user_id = $1`, userID,
	).Scan(&s.ID, &s.UserID, &s.Name, &s.Description, &logo, &s.ContactPhone, &s.Location, &s.Verified, &s.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	s.LogoURL = logo.String
	return s, nil
}

func (r *MarketplaceRepository) UpdateSellerProfile(ctx context.Context, id string, in models.SellerProfileInput) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE seller_profiles
		 SET name = $2, description = $3, logo_url = $4, contact_phone = $5, location = $6, updated_at = now()
		 WHERE id = $1`,
		id, in.Name, in.Description, in.LogoURL, in.ContactPhone, in.Location)
	return err
}

func (r *MarketplaceRepository) ListSellers(ctx context.Context) ([]models.SellerProfile, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, name, description, logo_url, contact_phone, location, verified, created_at
		 FROM seller_profiles ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sellers := []models.SellerProfile{}
	for rows.Next() {
		s := models.SellerProfile{}
		var logo sql.NullString
		if err := rows.Scan(&s.ID, &s.UserID, &s.Name, &s.Description, &logo, &s.ContactPhone, &s.Location, &s.Verified, &s.CreatedAt); err != nil {
			return nil, err
		}
		s.LogoURL = logo.String
		sellers = append(sellers, s)
	}
	return sellers, rows.Err()
}

const productSelect = `
	SELECT p.id, p.seller_id, sp.name AS seller_name, p.name, p.slug, p.description, p.category,
	       p.price::float8, p.stock, p.image_url, p.images,
	       p.material_batch_id, wt.name AS material_name,
	       p.recycled_percent, p.waste_recovered_kg::float8, p.unit, p.is_active,
	       coalesce(avg(r.rating), 0)::float8, count(r.id)::int,
	       p.created_at
	FROM products p
	JOIN seller_profiles sp ON sp.id = p.seller_id
	LEFT JOIN material_processing mp ON mp.id = p.material_batch_id
	LEFT JOIN waste_types wt ON wt.slug = mp.material
	LEFT JOIN product_reviews r ON r.product_id = p.id`

func scanProduct(row pgx.Row) (*models.Product, error) {
	p := &models.Product{}
	var images []byte
	var imageURL, batchID, materialName sql.NullString
	err := row.Scan(&p.ID, &p.SellerID, &p.SellerName, &p.Name, &p.Slug, &p.Description, &p.Category,
		&p.Price, &p.Stock, &imageURL, &images,
		&batchID, &materialName,
		&p.RecycledPercent, &p.WasteRecoveredKg, &p.Unit, &p.IsActive,
		&p.AvgRating, &p.ReviewCount,
		&p.CreatedAt)
	if err != nil {
		return nil, err
	}
	p.ImageURL = imageURL.String
	p.MaterialBatchID = batchID.String
	p.MaterialName = materialName.String
	p.Images = []string{}
	if len(images) > 0 {
		_ = json.Unmarshal(images, &p.Images)
	}
	return p, nil
}

func (r *MarketplaceRepository) ListProducts(ctx context.Context, params models.ProductListParams) ([]models.Product, error) {
	where := []string{"1 = 1"}
	args := []any{}
	if params.Category != "" {
		args = append(args, params.Category)
		where = append(where, fmt.Sprintf("p.category = $%d", len(args)))
	}
	if params.SellerID != "" {
		args = append(args, params.SellerID)
		where = append(where, fmt.Sprintf("p.seller_id = $%d", len(args)))
	}
	if params.OnlyBuy {
		where = append(where, "p.is_active = TRUE AND p.stock > 0")
	}
	if params.Q != "" {
		args = append(args, "%"+strings.ToLower(params.Q)+"%")
		where = append(where, fmt.Sprintf("(lower(p.name) LIKE $%d OR lower(p.description) LIKE $%d)", len(args), len(args)))
	}
	query := productSelect + "\n WHERE " + strings.Join(where, " AND ") +
		"\n GROUP BY p.id, sp.name, wt.name ORDER BY p.created_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []models.Product{}
	for rows.Next() {
		p, err := scanProduct(rows)
		if err != nil {
			return nil, err
		}
		products = append(products, *p)
	}
	return products, rows.Err()
}

func (r *MarketplaceRepository) GetProduct(ctx context.Context, id string) (*models.Product, error) {
	row := r.pool.QueryRow(ctx, productSelect+" WHERE p.id = $1 GROUP BY p.id, sp.name, wt.name", id)
	p, err := scanProduct(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *MarketplaceRepository) GetProductBySlug(ctx context.Context, slug string) (*models.Product, error) {
	row := r.pool.QueryRow(ctx, productSelect+" WHERE p.slug = $1 GROUP BY p.id, sp.name, wt.name", slug)
	p, err := scanProduct(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *MarketplaceRepository) CreateProduct(ctx context.Context, p *models.Product) error {
	images, err := jsonbArray(p.Images)
	if err != nil {
		return err
	}
	slug := slugify(p.Name)
	return r.pool.QueryRow(ctx,
		`INSERT INTO products
		   (seller_id, name, slug, description, category, price, stock, image_url, images,
		    material_batch_id, recycled_percent, waste_recovered_kg, unit, is_active)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		 RETURNING id, created_at`,
		p.SellerID, p.Name, slug, p.Description, p.Category, p.Price, p.Stock, p.ImageURL, images,
		p.MaterialBatchID, p.RecycledPercent, p.WasteRecoveredKg, p.Unit, p.IsActive,
	).Scan(&p.ID, &p.CreatedAt)
}

func (r *MarketplaceRepository) UpdateProduct(ctx context.Context, id string, in models.ProductInput) error {
	images, err := jsonbArray(in.Images)
	if err != nil {
		return err
	}
	isActive := true
	if in.IsActive != nil {
		isActive = *in.IsActive
	}
	_, err = r.pool.Exec(ctx,
		`UPDATE products
		 SET name = $2, description = $3, category = $4, price = $5, stock = $6, image_url = $7, images = $8,
		     material_batch_id = $9, recycled_percent = $10, waste_recovered_kg = $11, unit = $12,
		     is_active = $13, updated_at = now()
		 WHERE id = $1`,
		id, in.Name, in.Description, in.Category, in.Price, in.Stock, in.ImageURL, images,
		in.MaterialBatchID, in.RecycledPercent, in.WasteRecoveredKg, in.Unit, isActive)
	return err
}

func (r *MarketplaceRepository) SetProductActive(ctx context.Context, id string, active bool) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE products SET is_active = $2, updated_at = now() WHERE id = $1`, id, active)
	return err
}

func (r *MarketplaceRepository) CreateReview(ctx context.Context, rv *models.Review) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO product_reviews (product_id, user_id, rating, comment)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (product_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()
		 RETURNING id, created_at`,
		rv.ProductID, rv.UserID, rv.Rating, rv.Comment,
	).Scan(&rv.ID, &rv.CreatedAt)
}

func (r *MarketplaceRepository) ListReviews(ctx context.Context, productID string) ([]models.Review, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT rv.id, rv.product_id, rv.user_id, u.name, rv.rating, rv.comment, rv.created_at
		 FROM product_reviews rv
		 JOIN users u ON u.id = rv.user_id
		 WHERE rv.product_id = $1
		 ORDER BY rv.created_at DESC`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reviews := []models.Review{}
	for rows.Next() {
		rv := models.Review{}
		if err := rows.Scan(&rv.ID, &rv.ProductID, &rv.UserID, &rv.UserName, &rv.Rating, &rv.Comment, &rv.CreatedAt); err != nil {
			return nil, err
		}
		reviews = append(reviews, rv)
	}
	return reviews, rows.Err()
}

func (r *MarketplaceRepository) AddCartItem(ctx context.Context, userID, productID string, qty int) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO cart_items (user_id, product_id, quantity)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (user_id, product_id)
		 DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 99), updated_at = now()`,
		userID, productID, qty)
	return err
}

func (r *MarketplaceRepository) ListCartItems(ctx context.Context, userID string) ([]models.CartItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price::float8, p.stock, p.image_url,
		        sp.name, wt.name
		 FROM cart_items ci
		 JOIN products p ON p.id = ci.product_id
		 JOIN seller_profiles sp ON sp.id = p.seller_id
		 LEFT JOIN material_processing mp ON mp.id = p.material_batch_id
		 LEFT JOIN waste_types wt ON wt.slug = mp.material
		 WHERE ci.user_id = $1
		 ORDER BY ci.created_at ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.CartItem{}
	for rows.Next() {
		it := models.CartItem{}
		var imageURL, materialName sql.NullString
		if err := rows.Scan(&it.ID, &it.ProductID, &it.Quantity, &it.ProductName, &it.Price, &it.Stock,
			&imageURL, &it.SellerName, &materialName); err != nil {
			return nil, err
		}
		it.ImageURL = imageURL.String
		it.MaterialName = materialName.String
		it.LineTotal = it.Price * float64(it.Quantity)
		items = append(items, it)
	}
	return items, rows.Err()
}

func (r *MarketplaceRepository) UpdateCartItem(ctx context.Context, userID, itemID string, qty int) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE cart_items SET quantity = $3, updated_at = now()
		 WHERE id = $1 AND user_id = $2`, itemID, userID, qty)
	return err
}

func (r *MarketplaceRepository) RemoveCartItem(ctx context.Context, userID, itemID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cart_items WHERE id = $1 AND user_id = $2`, itemID, userID)
	return err
}

func (r *MarketplaceRepository) ClearCart(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cart_items WHERE user_id = $1`, userID)
	return err
}

func (r *MarketplaceRepository) Checkout(ctx context.Context, userID string, items []models.OrderItem, checkout models.CheckoutInput, subtotal, deliveryFee, total float64, orderNumber, ref string) (*models.Order, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	productIDs := make([]string, 0, len(items))
	for _, it := range items {
		productIDs = append(productIDs, it.ProductID)
		var stock int
		if err := tx.QueryRow(ctx,
			`SELECT stock FROM products WHERE id = $1 FOR UPDATE`, it.ProductID).Scan(&stock); err != nil {
			return nil, err
		}
		if stock < it.Quantity {
			return nil, fmt.Errorf("%w: %s", ErrInsufficientStock, it.ProductName)
		}
	}

	order := &models.Order{
		UserID:          userID,
		OrderNumber:     orderNumber,
		Status:          models.OrderStatusPaid,
		Subtotal:        subtotal,
		DeliveryFee:     deliveryFee,
		Total:           total,
		PaymentMethod:   checkout.PaymentMethod,
		DeliveryAddress: checkout.DeliveryAddress,
	}
	err = tx.QueryRow(ctx,
		`INSERT INTO orders (user_id, order_number, status, subtotal, delivery_fee, total, payment_method, delivery_address)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, created_at`,
		order.UserID, order.OrderNumber, order.Status, order.Subtotal, order.DeliveryFee, order.Total,
		order.PaymentMethod, order.DeliveryAddress,
	).Scan(&order.ID, &order.CreatedAt)
	if err != nil {
		return nil, err
	}

	for i := range items {
		it := &items[i]
		it.OrderID = order.ID
		if err := tx.QueryRow(ctx,
			`INSERT INTO order_items
			   (order_id, product_id, seller_id, product_name, unit_price, quantity, line_total, ecoroute_fee, seller_share, waste_recovered_kg)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			 RETURNING id`,
			it.OrderID, it.ProductID, it.SellerID, it.ProductName, it.UnitPrice, it.Quantity,
			it.LineTotal, it.EcoRouteFee, it.SellerShare, it.WasteRecoveredKg,
		).Scan(&it.ID); err != nil {
			return nil, err
		}
	}

	for _, pid := range productIDs {
		if _, err := tx.Exec(ctx,
			`UPDATE products SET stock = stock - 1, updated_at = now() WHERE id = $1`, pid); err != nil {
			return nil, err
		}
	}

	payment := &models.Payment{
		OrderID:   order.ID,
		Amount:    total,
		Method:    checkout.PaymentMethod,
		Status:    models.PaymentStatusPaid,
		Reference: ref,
	}
	if err := tx.QueryRow(ctx,
		`INSERT INTO payments (order_id, amount, method, status, reference)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
		payment.OrderID, payment.Amount, payment.Method, payment.Status, payment.Reference,
	).Scan(&payment.ID, &payment.CreatedAt); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `DELETE FROM cart_items WHERE user_id = $1`, userID); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	order.Items = items
	return order, nil
}

const orderSelect = `
	SELECT o.id, o.user_id, o.order_number, o.status, o.subtotal::float8, o.delivery_fee::float8,
	       o.total::float8, o.payment_method, o.delivery_address, o.created_at, u.name AS buyer_name
	FROM orders o
	JOIN users u ON u.id = o.user_id`

func (r *MarketplaceRepository) GetOrder(ctx context.Context, id string) (*models.Order, error) {
	order := &models.Order{}
	err := r.pool.QueryRow(ctx, orderSelect+" WHERE o.id = $1", id).Scan(
		&order.ID, &order.UserID, &order.OrderNumber, &order.Status, &order.Subtotal, &order.DeliveryFee,
		&order.Total, &order.PaymentMethod, &order.DeliveryAddress, &order.CreatedAt, &order.BuyerName)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	items, err := r.orderItems(ctx, order.ID)
	if err != nil {
		return nil, err
	}
	order.Items = items
	return order, nil
}

func (r *MarketplaceRepository) ListOrdersByUser(ctx context.Context, userID string) ([]models.Order, error) {
	rows, err := r.pool.Query(ctx, orderSelect+" WHERE o.user_id = $1 ORDER BY o.created_at DESC", userID)
	if err != nil {
		return nil, err
	}
	return r.scanOrders(ctx, rows)
}

func (r *MarketplaceRepository) ListOrdersBySeller(ctx context.Context, sellerID string) ([]models.Order, error) {
	rows, err := r.pool.Query(ctx,
		orderSelect+" WHERE o.id IN (SELECT DISTINCT oi.order_id FROM order_items oi WHERE oi.seller_id = $1) ORDER BY o.created_at DESC",
		sellerID)
	if err != nil {
		return nil, err
	}
	return r.scanOrders(ctx, rows)
}

func (r *MarketplaceRepository) ListAllOrders(ctx context.Context) ([]models.Order, error) {
	rows, err := r.pool.Query(ctx, orderSelect+" ORDER BY o.created_at DESC")
	if err != nil {
		return nil, err
	}
	return r.scanOrders(ctx, rows)
}

func (r *MarketplaceRepository) scanOrders(ctx context.Context, rows pgx.Rows) ([]models.Order, error) {
	defer rows.Close()
	orders := []models.Order{}
	for rows.Next() {
		o := models.Order{}
		if err := rows.Scan(&o.ID, &o.UserID, &o.OrderNumber, &o.Status, &o.Subtotal, &o.DeliveryFee,
			&o.Total, &o.PaymentMethod, &o.DeliveryAddress, &o.CreatedAt, &o.BuyerName); err != nil {
			return nil, err
		}
		items, err := r.orderItems(ctx, o.ID)
		if err != nil {
			return nil, err
		}
		o.Items = items
		orders = append(orders, o)
	}
	return orders, rows.Err()
}

func (r *MarketplaceRepository) orderItems(ctx context.Context, orderID string) ([]models.OrderItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT oi.id, oi.order_id, oi.product_id, oi.seller_id, sp.name,
		        oi.product_name, oi.unit_price::float8, oi.quantity, oi.line_total::float8,
		        oi.ecoroute_fee::float8, oi.seller_share::float8, oi.waste_recovered_kg::float8
		 FROM order_items oi
		 JOIN seller_profiles sp ON sp.id = oi.seller_id
		 WHERE oi.order_id = $1 ORDER BY oi.created_at ASC`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []models.OrderItem{}
	for rows.Next() {
		it := models.OrderItem{}
		if err := rows.Scan(&it.ID, &it.OrderID, &it.ProductID, &it.SellerID, &it.SellerName,
			&it.ProductName, &it.UnitPrice, &it.Quantity, &it.LineTotal,
			&it.EcoRouteFee, &it.SellerShare, &it.WasteRecoveredKg); err != nil {
			return nil, err
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

func (r *MarketplaceRepository) UpdateOrderStatus(ctx context.Context, id, status string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE orders SET status = $2, updated_at = now() WHERE id = $1`, id, status)
	return err
}

func (r *MarketplaceRepository) SellerStats(ctx context.Context, sellerID string) (*models.SellerStats, error) {
	s := &models.SellerStats{}
	err := r.pool.QueryRow(ctx,
		`SELECT
		    (SELECT count(*) FROM products WHERE seller_id = $1 AND is_active),
		    (SELECT count(*) FROM order_items oi WHERE oi.seller_id = $1 AND oi.order_id IN (SELECT id FROM orders WHERE status IN ('pending','paid'))),
		    (SELECT count(*) FROM order_items oi WHERE oi.seller_id = $1 AND oi.order_id IN (SELECT id FROM orders WHERE status = 'shipped')),
		    (SELECT coalesce(sum(oi.line_total),0) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.seller_id = $1 AND o.status != 'cancelled'),
		    (SELECT coalesce(sum(oi.seller_share),0) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.seller_id = $1 AND o.status != 'cancelled'),
		    (SELECT coalesce(sum(oi.waste_recovered_kg),0) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.seller_id = $1 AND o.status != 'cancelled'),
		    (SELECT coalesce(sum(oi.quantity),0) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.seller_id = $1 AND o.status != 'cancelled')
		 `, sellerID,
	).Scan(&s.ProductsActive, &s.OrdersPending, &s.OrdersShipped, &s.TotalSales, &s.TotalSellerShare,
		&s.RecycledMaterialKg, &s.ProductsSold)
	return s, err
}

func (r *MarketplaceRepository) Summary(ctx context.Context) (*models.MarketplaceSummary, error) {
	s := &models.MarketplaceSummary{}
	err := r.pool.QueryRow(ctx,
		`SELECT sellers, active_products, total_products, orders, gross_sales,
		        open_orders, waste_recovered_kg, material_recycled_kg
		 FROM marketplace_admin_summary`).Scan(
		&s.Sellers, &s.ActiveProducts, &s.TotalProducts, &s.Orders, &s.GrossSales,
		&s.OpenOrders, &s.WasteRecoveredKg, &s.MaterialRecycledKg)
	return s, err
}

func (r *MarketplaceRepository) TraceSource(ctx context.Context, sourceType, sourceID string) (*models.TraceSource, error) {
	ts := &models.TraceSource{Type: sourceType}
	var err error
	if sourceType == "collection" {
		var name string
		err = r.pool.QueryRow(ctx,
			`SELECT wp.name
			 FROM collection_records cr
			 JOIN waste_points wp ON wp.id = cr.waste_point_id
			 WHERE cr.id = $1`, sourceID).Scan(&name)
		if err == nil {
			ts.Label = "Collected from " + name
			ts.Detail = "Waste collected by an EcoRoute truck on a scheduled route."
		}
	} else {
		var name string
		err = r.pool.QueryRow(ctx,
			`SELECT wt.name
			 FROM recycling_records rr
			 JOIN waste_types wt ON wt.slug = rr.waste_type
			 WHERE rr.id = $1`, sourceID).Scan(&name)
		if err == nil {
			ts.Label = "Resident drop-off"
			ts.Detail = name + " dropped off at an EcoRoute recycling point."
		}
	}
	if errors.Is(err, pgx.ErrNoRows) {
		ts.Label = "EcoRoute recovery"
		ts.Detail = "Recovered material from the EcoRoute recycling pipeline."
		return ts, nil
	}
	if err != nil {
		return nil, err
	}
	return ts, nil
}

func (r *MarketplaceRepository) ListMaterialBatches(ctx context.Context) ([]models.MaterialBatch, error) {
	return (&MaterialProcessingRepository{pool: r.pool}).ListBatches(ctx)
}

func jsonbArray(arr []string) ([]byte, error) {
	if arr == nil {
		arr = []string{}
	}
	return json.Marshal(arr)
}

func slugify(name string) string {
	lower := strings.ToLower(strings.TrimSpace(name))
	var b strings.Builder
	for _, r := range lower {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == ' ' || r == '-':
			b.WriteByte('-')
		}
	}
	s := b.String()
	if s == "" {
		s = "product"
	}
	return s
}
