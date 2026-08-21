package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type MarketplaceHandler struct {
	svc *services.MarketplaceService
}

func NewMarketplaceHandler(svc *services.MarketplaceService) *MarketplaceHandler {
	return &MarketplaceHandler{svc: svc}
}

func (h *MarketplaceHandler) userID(r *http.Request) string {
	if claims, ok := middleware.ClaimsFrom(r); ok {
		return claims.UserID
	}
	return ""
}

func respondServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrValidation):
		utils.RespondError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, services.ErrNotFound):
		utils.RespondError(w, http.StatusNotFound, "not found")
	case errors.Is(err, services.ErrInsufficientStock):
		utils.RespondError(w, http.StatusConflict, err.Error())
	default:
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
	}
}

// --- Seller profiles ---

func (h *MarketplaceHandler) RegisterSeller(w http.ResponseWriter, r *http.Request) {
	var in models.SellerProfileInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	profile, err := h.svc.RegisterSeller(r.Context(), h.userID(r), in)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusCreated, profile)
}

func (h *MarketplaceHandler) MySellerProfile(w http.ResponseWriter, r *http.Request) {
	profile, err := h.svc.MySellerProfile(r.Context(), h.userID(r))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	if profile == nil {
		utils.RespondError(w, http.StatusNotFound, "no seller profile")
		return
	}
	utils.RespondData(w, http.StatusOK, profile)
}

func (h *MarketplaceHandler) UpdateSellerProfile(w http.ResponseWriter, r *http.Request) {
	var in models.SellerProfileInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	profile, err := h.svc.UpdateSellerProfile(r.Context(), h.userID(r), in)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, profile)
}

func (h *MarketplaceHandler) ListSellers(w http.ResponseWriter, r *http.Request) {
	sellers, err := h.svc.ListSellers(r.Context())
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, sellers)
}

// --- Products ---

func (h *MarketplaceHandler) ListProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	params := models.ProductListParams{
		Category: q.Get("category"),
		Q:        q.Get("q"),
		SellerID: q.Get("seller_id"),
		OnlyBuy:  q.Get("scope") != "all",
	}
	products, err := h.svc.ListProducts(r.Context(), params)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, products)
}

func (h *MarketplaceHandler) GetProduct(w http.ResponseWriter, r *http.Request) {
	p, err := h.svc.GetProduct(r.Context(), r.PathValue("id"))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, p)
}

func (h *MarketplaceHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var in models.ProductInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	p, err := h.svc.CreateProduct(r.Context(), h.userID(r), in)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusCreated, p)
}

func (h *MarketplaceHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	var in models.ProductInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	p, err := h.svc.UpdateProduct(r.Context(), h.userID(r), r.PathValue("id"), in)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, p)
}

func (h *MarketplaceHandler) ToggleProduct(w http.ResponseWriter, r *http.Request) {
	active := true
	if strings.EqualFold(r.URL.Query().Get("active"), "false") {
		active = false
	}
	p, err := h.svc.SetProductActive(r.Context(), h.userID(r), r.PathValue("id"), active)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, p)
}

// --- Reviews ---

func (h *MarketplaceHandler) CreateReview(w http.ResponseWriter, r *http.Request) {
	var in models.ReviewInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	rv, err := h.svc.AddReview(r.Context(), h.userID(r), r.PathValue("id"), in)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusCreated, rv)
}

func (h *MarketplaceHandler) ListReviews(w http.ResponseWriter, r *http.Request) {
	reviews, err := h.svc.ListReviews(r.Context(), r.PathValue("id"))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, reviews)
}

// --- Cart ---

func (h *MarketplaceHandler) AddCartItem(w http.ResponseWriter, r *http.Request) {
	var in models.CartItemInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.svc.AddToCart(r.Context(), h.userID(r), in.ProductID, in.Quantity); err != nil {
		respondServiceError(w, err)
		return
	}
	cart, err := h.svc.Cart(r.Context(), h.userID(r))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, cart)
}

func (h *MarketplaceHandler) Cart(w http.ResponseWriter, r *http.Request) {
	cart, err := h.svc.Cart(r.Context(), h.userID(r))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, cart)
}

func (h *MarketplaceHandler) UpdateCartItem(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Quantity int `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.svc.UpdateCartItem(r.Context(), h.userID(r), r.PathValue("id"), in.Quantity); err != nil {
		respondServiceError(w, err)
		return
	}
	cart, err := h.svc.Cart(r.Context(), h.userID(r))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, cart)
}

func (h *MarketplaceHandler) RemoveCartItem(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.RemoveCartItem(r.Context(), h.userID(r), r.PathValue("id")); err != nil {
		respondServiceError(w, err)
		return
	}
	cart, err := h.svc.Cart(r.Context(), h.userID(r))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, cart)
}

// --- Orders ---

func (h *MarketplaceHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	var in models.CheckoutInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	order, err := h.svc.Checkout(r.Context(), h.userID(r), in)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusCreated, order)
}

func (h *MarketplaceHandler) MyOrders(w http.ResponseWriter, r *http.Request) {
	orders, err := h.svc.MyOrders(r.Context(), h.userID(r))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, orders)
}

func (h *MarketplaceHandler) SellerOrders(w http.ResponseWriter, r *http.Request) {
	orders, err := h.svc.SellerOrders(r.Context(), h.userID(r))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, orders)
}

func (h *MarketplaceHandler) AllOrders(w http.ResponseWriter, r *http.Request) {
	orders, err := h.svc.AllOrders(r.Context())
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, orders)
}

func (h *MarketplaceHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	order, err := h.svc.GetOrder(r.Context(), r.PathValue("id"))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, order)
}

func (h *MarketplaceHandler) UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	var in models.OrderStatusInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	order, err := h.svc.UpdateOrderStatus(r.Context(), r.PathValue("id"), in.Status)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, order)
}

// --- Stats / trace / admin ---

func (h *MarketplaceHandler) SellerStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.SellerStats(r.Context(), h.userID(r))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, stats)
}

func (h *MarketplaceHandler) Summary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.svc.Summary(r.Context())
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, summary)
}

func (h *MarketplaceHandler) Trace(w http.ResponseWriter, r *http.Request) {
	trace, err := h.svc.Trace(r.Context(), r.PathValue("id"))
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, trace)
}

func (h *MarketplaceHandler) MaterialBatches(w http.ResponseWriter, r *http.Request) {
	batches, err := h.svc.MaterialBatches(r.Context())
	if err != nil {
		respondServiceError(w, err)
		return
	}
	utils.RespondData(w, http.StatusOK, batches)
}
