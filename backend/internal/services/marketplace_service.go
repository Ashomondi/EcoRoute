package services

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
)

const deliveryFee = 150.0

var ErrInsufficientStock = errors.New("insufficient stock")

type MarketplaceService struct {
	repo        *repositories.MarketplaceRepository
	processing  *repositories.MaterialProcessingRepository
	recycle     *repositories.RecyclingRepository
}

func NewMarketplaceService(repo *repositories.MarketplaceRepository, processing *repositories.MaterialProcessingRepository, recycle *repositories.RecyclingRepository) *MarketplaceService {
	return &MarketplaceService{repo: repo, processing: processing, recycle: recycle}
}

func (s *MarketplaceService) RegisterSeller(ctx context.Context, userID string, in models.SellerProfileInput) (*models.SellerProfile, error) {
	if strings.TrimSpace(in.Name) == "" {
		return nil, fmt.Errorf("%w: business name is required", ErrValidation)
	}
	if len(in.Name) > 80 {
		return nil, fmt.Errorf("%w: business name is too long", ErrValidation)
	}
	existing, err := s.repo.GetSellerProfileByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return existing, nil
	}
	profile := &models.SellerProfile{
		UserID:       userID,
		Name:         strings.TrimSpace(in.Name),
		Description:  in.Description,
		LogoURL:      in.LogoURL,
		ContactPhone: in.ContactPhone,
		Location:     in.Location,
		Verified:     false,
	}
	if err := s.repo.CreateSellerProfile(ctx, profile); err != nil {
		return nil, err
	}
	return profile, nil
}

func (s *MarketplaceService) MySellerProfile(ctx context.Context, userID string) (*models.SellerProfile, error) {
	return s.repo.GetSellerProfileByUser(ctx, userID)
}

func (s *MarketplaceService) UpdateSellerProfile(ctx context.Context, userID string, in models.SellerProfileInput) (*models.SellerProfile, error) {
	if strings.TrimSpace(in.Name) == "" {
		return nil, fmt.Errorf("%w: business name is required", ErrValidation)
	}
	profile, err := s.repo.GetSellerProfileByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, ErrNotFound
	}
	if err := s.repo.UpdateSellerProfile(ctx, profile.ID, in); err != nil {
		return nil, err
	}
	return s.repo.GetSellerProfile(ctx, profile.ID)
}

func (s *MarketplaceService) ListSellers(ctx context.Context) ([]models.SellerProfile, error) {
	return s.repo.ListSellers(ctx)
}

func (s *MarketplaceService) GetSeller(ctx context.Context, id string) (*models.SellerProfile, error) {
	return s.repo.GetSellerProfile(ctx, id)
}

func (s *MarketplaceService) ListProducts(ctx context.Context, params models.ProductListParams) ([]models.Product, error) {
	if params.Category != "" && !containsStr(models.ProductCategories, params.Category) {
		return nil, fmt.Errorf("%w: unknown category", ErrValidation)
	}
	return s.repo.ListProducts(ctx, params)
}

func (s *MarketplaceService) GetProduct(ctx context.Context, id string) (*models.Product, error) {
	p, err := s.repo.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, ErrNotFound
	}
	return p, nil
}

func (s *MarketplaceService) CreateProduct(ctx context.Context, userID string, in models.ProductInput) (*models.Product, error) {
	profile, err := s.repo.GetSellerProfileByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, fmt.Errorf("%w: register a seller profile before listing products", ErrValidation)
	}
	if err := validateProductInput(in); err != nil {
		return nil, err
	}
	batch := in.MaterialBatchID
	if batch != "" {
		b, err := s.processing.GetBatch(ctx, batch)
		if err != nil {
			return nil, err
		}
		if b == nil {
			return nil, fmt.Errorf("%w: material batch not found", ErrValidation)
		}
	}

	p := &models.Product{
		SellerID:         profile.ID,
		Name:             strings.TrimSpace(in.Name),
		Description:      in.Description,
		Category:         in.Category,
		Price:            in.Price,
		Stock:            in.Stock,
		ImageURL:         in.ImageURL,
		Images:           in.Images,
		MaterialBatchID:  batch,
		RecycledPercent:  in.RecycledPercent,
		WasteRecoveredKg: in.WasteRecoveredKg,
		Unit:             orDefault(in.Unit, "unit"),
		IsActive:         true,
	}
	if err := s.repo.CreateProduct(ctx, p); err != nil {
		return nil, err
	}
	return s.repo.GetProduct(ctx, p.ID)
}

func (s *MarketplaceService) UpdateProduct(ctx context.Context, userID, productID string, in models.ProductInput) (*models.Product, error) {
	profile, err := s.repo.GetSellerProfileByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, ErrNotFound
	}
	p, err := s.repo.GetProduct(ctx, productID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, ErrNotFound
	}
	if p.SellerID != profile.ID {
		return nil, fmt.Errorf("%w: not your product", ErrValidation)
	}
	if err := validateProductInput(in); err != nil {
		return nil, err
	}
	if err := s.repo.UpdateProduct(ctx, productID, in); err != nil {
		return nil, err
	}
	return s.repo.GetProduct(ctx, productID)
}

func (s *MarketplaceService) SetProductActive(ctx context.Context, userID, productID string, active bool) (*models.Product, error) {
	profile, err := s.repo.GetSellerProfileByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, ErrNotFound
	}
	p, err := s.repo.GetProduct(ctx, productID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, ErrNotFound
	}
	if p.SellerID != profile.ID {
		return nil, fmt.Errorf("%w: not your product", ErrValidation)
	}
	if err := s.repo.SetProductActive(ctx, productID, active); err != nil {
		return nil, err
	}
	return s.repo.GetProduct(ctx, productID)
}

func validateProductInput(in models.ProductInput) error {
	if strings.TrimSpace(in.Name) == "" {
		return fmt.Errorf("%w: product name is required", ErrValidation)
	}
	if len(in.Name) > 120 {
		return fmt.Errorf("%w: product name is too long", ErrValidation)
	}
	if !containsStr(models.ProductCategories, in.Category) {
		return fmt.Errorf("%w: unknown category", ErrValidation)
	}
	if in.Price < 0 || in.Price > 1000000 {
		return fmt.Errorf("%w: invalid price", ErrValidation)
	}
	if in.Stock < 0 || in.Stock > 100000 {
		return fmt.Errorf("%w: invalid stock", ErrValidation)
	}
	if in.RecycledPercent < 0 || in.RecycledPercent > 100 {
		return fmt.Errorf("%w: recycled_percent must be between 0 and 100", ErrValidation)
	}
	if in.WasteRecoveredKg < 0 || in.WasteRecoveredKg > 100000 {
		return fmt.Errorf("%w: invalid waste_recovered_kg", ErrValidation)
	}
	return nil
}

func (s *MarketplaceService) AddReview(ctx context.Context, userID, productID string, in models.ReviewInput) (*models.Review, error) {
	if in.Rating < 1 || in.Rating > 5 {
		return nil, fmt.Errorf("%w: rating must be between 1 and 5", ErrValidation)
	}
	p, err := s.repo.GetProduct(ctx, productID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, ErrNotFound
	}
	rv := &models.Review{ProductID: productID, UserID: userID, Rating: in.Rating, Comment: in.Comment}
	if err := s.repo.CreateReview(ctx, rv); err != nil {
		return nil, err
	}
	return rv, nil
}

func (s *MarketplaceService) ListReviews(ctx context.Context, productID string) ([]models.Review, error) {
	return s.repo.ListReviews(ctx, productID)
}

func (s *MarketplaceService) AddToCart(ctx context.Context, userID, productID string, qty int) error {
	if qty < 1 {
		return fmt.Errorf("%w: quantity must be at least 1", ErrValidation)
	}
	p, err := s.repo.GetProduct(ctx, productID)
	if err != nil {
		return err
	}
	if p == nil || !p.IsActive {
		return ErrNotFound
	}
	if p.Stock <= 0 {
		return fmt.Errorf("%w: product is out of stock", ErrValidation)
	}
	return s.repo.AddCartItem(ctx, userID, productID, qty)
}

func (s *MarketplaceService) Cart(ctx context.Context, userID string) ([]models.CartItem, error) {
	return s.repo.ListCartItems(ctx, userID)
}

func (s *MarketplaceService) UpdateCartItem(ctx context.Context, userID, itemID string, qty int) error {
	if qty < 1 || qty > 99 {
		return fmt.Errorf("%w: invalid quantity", ErrValidation)
	}
	return s.repo.UpdateCartItem(ctx, userID, itemID, qty)
}

func (s *MarketplaceService) RemoveCartItem(ctx context.Context, userID, itemID string) error {
	return s.repo.RemoveCartItem(ctx, userID, itemID)
}

func (s *MarketplaceService) Checkout(ctx context.Context, userID string, in models.CheckoutInput) (*models.Order, error) {
	if strings.TrimSpace(in.DeliveryAddress) == "" {
		return nil, fmt.Errorf("%w: delivery address is required", ErrValidation)
	}
	if in.PaymentMethod == "" {
		in.PaymentMethod = "mpesa"
	}
	cart, err := s.repo.ListCartItems(ctx, userID)
	if err != nil {
		return nil, err
	}
	if len(cart) == 0 {
		return nil, fmt.Errorf("%w: cart is empty", ErrValidation)
	}

	items := make([]models.OrderItem, 0, len(cart))
	var subtotal float64
	for _, ci := range cart {
		p, err := s.repo.GetProduct(ctx, ci.ProductID)
		if err != nil {
			return nil, err
		}
		if p == nil || !p.IsActive {
			return nil, fmt.Errorf("%w: product unavailable: %s", ErrValidation, ci.ProductName)
		}
		if p.Stock < ci.Quantity {
			return nil, fmt.Errorf("%w: only %d left of %s", ErrValidation, p.Stock, p.Name)
		}
		line := p.Price * float64(ci.Quantity)
		fee := round2(line * models.EcoRouteCommission)
		items = append(items, models.OrderItem{
			ProductID:        p.ID,
			SellerID:         p.SellerID,
			ProductName:      p.Name,
			UnitPrice:        p.Price,
			Quantity:         ci.Quantity,
			LineTotal:        line,
			EcoRouteFee:      fee,
			SellerShare:      round2(line - fee),
			WasteRecoveredKg: p.WasteRecoveredKg * float64(ci.Quantity),
		})
		subtotal += line
	}
	total := subtotal + deliveryFee

	order, err := s.repo.Checkout(ctx, userID, items, in, round2(subtotal), deliveryFee, round2(total),
		newOrderNumber(), newReference())
	if err != nil {
		if errors.Is(err, repositories.ErrInsufficientStock) {
			return nil, fmt.Errorf("%w: %s", ErrInsufficientStock, err.Error())
		}
		return nil, err
	}
	return order, nil
}

func (s *MarketplaceService) MyOrders(ctx context.Context, userID string) ([]models.Order, error) {
	return s.repo.ListOrdersByUser(ctx, userID)
}

func (s *MarketplaceService) GetOrder(ctx context.Context, id string) (*models.Order, error) {
	return s.repo.GetOrder(ctx, id)
}

func (s *MarketplaceService) SellerOrders(ctx context.Context, userID string) ([]models.Order, error) {
	profile, err := s.repo.GetSellerProfileByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, ErrNotFound
	}
	return s.repo.ListOrdersBySeller(ctx, profile.ID)
}

func (s *MarketplaceService) AllOrders(ctx context.Context) ([]models.Order, error) {
	return s.repo.ListAllOrders(ctx)
}

func (s *MarketplaceService) UpdateOrderStatus(ctx context.Context, id, status string) (*models.Order, error) {
	switch status {
	case models.OrderStatusPending, models.OrderStatusPaid, models.OrderStatusShipped,
		models.OrderStatusDelivered, models.OrderStatusCancelled:
	default:
		return nil, fmt.Errorf("%w: invalid order status", ErrValidation)
	}
	order, err := s.repo.GetOrder(ctx, id)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, ErrNotFound
	}
	if err := s.repo.UpdateOrderStatus(ctx, id, status); err != nil {
		return nil, err
	}
	return s.repo.GetOrder(ctx, id)
}

func (s *MarketplaceService) SellerStats(ctx context.Context, userID string) (*models.SellerStats, error) {
	profile, err := s.repo.GetSellerProfileByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, ErrNotFound
	}
	return s.repo.SellerStats(ctx, profile.ID)
}

func (s *MarketplaceService) Summary(ctx context.Context) (*models.MarketplaceSummary, error) {
	return s.repo.Summary(ctx)
}

func (s *MarketplaceService) Trace(ctx context.Context, productID string) (*models.MaterialTrace, error) {
	p, err := s.repo.GetProduct(ctx, productID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, ErrNotFound
	}
	trace := &models.MaterialTrace{Product: *p}
	if p.MaterialBatchID != "" {
		batch, err := s.processing.GetBatch(ctx, p.MaterialBatchID)
		if err != nil {
			return nil, err
		}
		if batch != nil {
			trace.Batch = *batch
			src, err := s.repo.TraceSource(ctx, batch.SourceType, batch.SourceID)
			if err != nil {
				return nil, err
			}
			trace.Source = *src
		}
	}
	return trace, nil
}

func (s *MarketplaceService) MaterialBatches(ctx context.Context) ([]models.MaterialBatch, error) {
	return s.repo.ListMaterialBatches(ctx)
}

func round2(v float64) float64 {
	return float64(int((v+0.005)*100)) / 100
}

func containsStr(list []string, v string) bool {
	for _, s := range list {
		if s == v {
			return true
		}
	}
	return false
}

func orDefault(v, def string) string {
	if strings.TrimSpace(v) == "" {
		return def
	}
	return v
}

func newOrderNumber() string {
	return fmt.Sprintf("ECO-%s-%04d", time.Now().Format("20060102"), randInt(10000))
}

func newReference() string {
	return fmt.Sprintf("PAY-%s-%04d", time.Now().Format("20060102150405"), randInt(10000))
}

func randInt(n int64) int64 {
	v, err := rand.Int(rand.Reader, big.NewInt(n))
	if err != nil {
		return 0
	}
	return v.Int64()
}
