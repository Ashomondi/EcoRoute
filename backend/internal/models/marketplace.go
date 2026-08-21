package models

import "time"

const (
	ProductCategoryPlastic = "plastic"
	ProductCategoryPaper   = "paper"
	ProductCategoryGlass   = "glass"
	ProductCategoryOrganic = "organic"
	ProductCategoryWood    = "wood"
	ProductCategoryTextile = "textile"
	ProductCategoryMetal   = "metal"
	ProductCategoryOther   = "other"

	OrderStatusPending   = "pending"
	OrderStatusPaid      = "paid"
	OrderStatusShipped   = "shipped"
	OrderStatusDelivered = "delivered"
	OrderStatusCancelled = "cancelled"

	PaymentStatusPending   = "pending"
	PaymentStatusPaid      = "paid"
	PaymentStatusFailed    = "failed"
	PaymentStatusRefunded  = "refunded"

	EcoRouteCommission = 0.10
)

var ProductCategories = []string{
	ProductCategoryPlastic,
	ProductCategoryPaper,
	ProductCategoryGlass,
	ProductCategoryOrganic,
	ProductCategoryWood,
	ProductCategoryTextile,
	ProductCategoryMetal,
	ProductCategoryOther,
}

type SellerProfile struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	LogoURL      string    `json:"logo_url"`
	ContactPhone string    `json:"contact_phone"`
	Location     string    `json:"location"`
	Verified     bool      `json:"verified"`
	CreatedAt    time.Time `json:"created_at"`
}

type SellerProfileInput struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	LogoURL      string `json:"logo_url"`
	ContactPhone string `json:"contact_phone"`
	Location     string `json:"location"`
}

type Product struct {
	ID               string    `json:"id"`
	SellerID         string    `json:"seller_id"`
	SellerName       string    `json:"seller_name"`
	Name             string    `json:"name"`
	Slug             string    `json:"slug"`
	Description      string    `json:"description"`
	Category         string    `json:"category"`
	Price            float64   `json:"price"`
	Stock            int       `json:"stock"`
	ImageURL         string    `json:"image_url"`
	Images           []string  `json:"images"`
	MaterialBatchID  string    `json:"material_batch_id"`
	MaterialName     string    `json:"material_name"`
	RecycledPercent  int       `json:"recycled_percent"`
	WasteRecoveredKg float64   `json:"waste_recovered_kg"`
	Unit             string    `json:"unit"`
	IsActive         bool      `json:"is_active"`
	AvgRating        float64   `json:"avg_rating"`
	ReviewCount      int       `json:"review_count"`
	CreatedAt        time.Time `json:"created_at"`
}

type ProductInput struct {
	Name             string   `json:"name"`
	Description      string   `json:"description"`
	Category         string   `json:"category"`
	Price            float64  `json:"price"`
	Stock            int      `json:"stock"`
	ImageURL         string   `json:"image_url"`
	Images           []string `json:"images"`
	MaterialBatchID  string   `json:"material_batch_id"`
	RecycledPercent  int      `json:"recycled_percent"`
	WasteRecoveredKg float64  `json:"waste_recovered_kg"`
	Unit             string   `json:"unit"`
	IsActive         *bool    `json:"is_active"`
}

type ProductListParams struct {
	Category string
	Q        string
	SellerID string
	OnlyBuy  bool // only active products with stock (public listing)
}

type Review struct {
	ID        string    `json:"id"`
	ProductID string    `json:"product_id"`
	UserID    string    `json:"user_id"`
	UserName  string    `json:"user_name"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

type ReviewInput struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

type CartItem struct {
	ID           string  `json:"id"`
	ProductID    string  `json:"product_id"`
	Quantity     int     `json:"quantity"`
	ProductName  string  `json:"product_name"`
	Price        float64 `json:"price"`
	Stock        int     `json:"stock"`
	ImageURL     string  `json:"image_url"`
	SellerName   string  `json:"seller_name"`
	LineTotal    float64 `json:"line_total"`
	MaterialName string  `json:"material_name"`
}

type CartItemInput struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type Order struct {
	ID              string      `json:"id"`
	UserID          string      `json:"user_id"`
	OrderNumber     string      `json:"order_number"`
	Status          string      `json:"status"`
	Subtotal        float64     `json:"subtotal"`
	DeliveryFee     float64     `json:"delivery_fee"`
	Total           float64     `json:"total"`
	PaymentMethod   string      `json:"payment_method"`
	DeliveryAddress string      `json:"delivery_address"`
	CreatedAt       time.Time   `json:"created_at"`
	Items           []OrderItem `json:"items,omitempty"`
	BuyerName       string      `json:"buyer_name,omitempty"`
}

type OrderItem struct {
	ID               string  `json:"id"`
	OrderID          string  `json:"order_id"`
	ProductID        string  `json:"product_id"`
	SellerID         string  `json:"seller_id"`
	SellerName       string  `json:"seller_name"`
	ProductName      string  `json:"product_name"`
	UnitPrice        float64 `json:"unit_price"`
	Quantity         int     `json:"quantity"`
	LineTotal        float64 `json:"line_total"`
	EcoRouteFee      float64 `json:"ecoroute_fee"`
	SellerShare      float64 `json:"seller_share"`
	WasteRecoveredKg float64 `json:"waste_recovered_kg"`
}

type CheckoutInput struct {
	PaymentMethod   string `json:"payment_method"`
	DeliveryAddress string `json:"delivery_address"`
}

type OrderStatusInput struct {
	Status string `json:"status"`
}

type Payment struct {
	ID        string    `json:"id"`
	OrderID   string    `json:"order_id"`
	Amount    float64   `json:"amount"`
	Method    string    `json:"method"`
	Status    string    `json:"status"`
	Reference string    `json:"reference"`
	CreatedAt time.Time `json:"created_at"`
}

type MaterialTrace struct {
	Product Product      `json:"product"`
	Batch   MaterialBatch `json:"batch"`
	Source  TraceSource  `json:"source"`
}

type TraceSource struct {
	Type     string `json:"type"` // collection | dropoff
	Label    string `json:"label"`
	Detail   string `json:"detail"`
}

type SellerStats struct {
	ProductsActive     int     `json:"products_active"`
	OrdersPending      int     `json:"orders_pending"`
	OrdersShipped      int     `json:"orders_shipped"`
	TotalSales         float64 `json:"total_sales"`
	TotalSellerShare   float64 `json:"total_seller_share"`
	RecycledMaterialKg float64 `json:"recycled_material_kg"`
	ProductsSold       int     `json:"products_sold"`
}

type MarketplaceSummary struct {
	Sellers           int     `json:"sellers"`
	ActiveProducts    int     `json:"active_products"`
	TotalProducts     int     `json:"total_products"`
	Orders            int     `json:"orders"`
	GrossSales        float64 `json:"gross_sales"`
	OpenOrders        int     `json:"open_orders"`
	WasteRecoveredKg  float64 `json:"waste_recovered_kg"`
	MaterialRecycledKg float64 `json:"material_recycled_kg"`
}
