package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterMarketplace(r *Router) {
	deps := r.Deps()
	marketRepo := repositories.NewMarketplaceRepository(deps.DB)
	processingRepo := repositories.NewMaterialProcessingRepository(deps.DB)
	recyclingRepo := repositories.NewRecyclingRepository(deps.DB)
	marketSvc := services.NewMarketplaceService(marketRepo, processingRepo, recyclingRepo)
	h := handlers.NewMarketplaceHandler(marketSvc)

	auth := middleware.RequireAuth(deps.Config)
	admin := middleware.RequireRole(string(models.RoleAdmin))

	// Public browsing
	r.Handle("GET", "/market/products", h.ListProducts)
	r.Handle("GET", "/market/products/{id}", h.GetProduct)
	r.Handle("GET", "/market/products/{id}/reviews", h.ListReviews)
	r.Handle("GET", "/market/products/{id}/trace", h.Trace)
	r.Handle("GET", "/market/sellers", h.ListSellers)

	// Seller profile (authenticated)
	r.Handle("POST", "/market/sellers", auth(h.RegisterSeller))
	r.Handle("GET", "/market/sellers/me", auth(h.MySellerProfile))
	r.Handle("PUT", "/market/sellers/me", auth(h.UpdateSellerProfile))

	// Seller catalogue
	r.Handle("POST", "/market/products", auth(h.CreateProduct))
	r.Handle("PUT", "/market/products/{id}", auth(h.UpdateProduct))
	r.Handle("DELETE", "/market/products/{id}", auth(h.ToggleProduct))
	r.Handle("GET", "/market/material-batches", auth(h.MaterialBatches))

	// Reviews
	r.Handle("POST", "/market/products/{id}/reviews", auth(h.CreateReview))

	// Cart
	r.Handle("GET", "/market/cart", auth(h.Cart))
	r.Handle("POST", "/market/cart", auth(h.AddCartItem))
	r.Handle("PUT", "/market/cart/{id}", auth(h.UpdateCartItem))
	r.Handle("DELETE", "/market/cart/{id}", auth(h.RemoveCartItem))

	// Orders
	r.Handle("POST", "/market/orders", auth(h.Checkout))
	r.Handle("GET", "/market/orders/mine", auth(h.MyOrders))
	r.Handle("GET", "/market/seller/orders", auth(h.SellerOrders))
	r.Handle("GET", "/market/seller/stats", auth(h.SellerStats))

	// Admin
	r.Handle("GET", "/market/admin/orders", auth(admin(h.AllOrders)))
	r.Handle("GET", "/market/admin/orders/{id}", auth(admin(h.GetOrder)))
	r.Handle("PUT", "/market/admin/orders/{id}/status", auth(admin(h.UpdateOrderStatus)))
	r.Handle("GET", "/market/admin/summary", auth(admin(h.Summary)))
	r.Handle("GET", "/market/admin/material-batches", auth(admin(h.MaterialBatches)))
}
