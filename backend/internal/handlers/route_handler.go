package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type RouteHandler struct {
	svc *services.RouteService
}

func NewRouteHandler(svc *services.RouteService) *RouteHandler {
	return &RouteHandler{svc: svc}
}

type optimizeRequest struct {
	TruckID string `json:"truck_id"`
}

func (h *RouteHandler) Optimize(w http.ResponseWriter, r *http.Request) {
	var in optimizeRequest
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if in.TruckID == "" {
		utils.RespondError(w, http.StatusBadRequest, "truck_id is required")
		return
	}

	result, err := h.svc.OptimizeRoute(r.Context(), in.TruckID)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			utils.RespondError(w, http.StatusNotFound, "truck not found")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusCreated, result)
}

func (h *RouteHandler) List(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	routes, err := h.svc.ListForUser(r.Context(), claims.UserID, claims.Role, r.URL.Query().Get("truck_id"))
	if err != nil {
		if errors.Is(err, services.ErrForbidden) {
			utils.RespondError(w, http.StatusForbidden, "forbidden: insufficient role")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, routes)
}

func (h *RouteHandler) Get(w http.ResponseWriter, r *http.Request) {
	route, err := h.svc.GetByID(r.Context(), r.PathValue("id"))
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			utils.RespondError(w, http.StatusNotFound, "route not found")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, route)
}

func (h *RouteHandler) GetStops(w http.ResponseWriter, r *http.Request) {
	stops, err := h.svc.GetStops(r.Context(), r.PathValue("id"))
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			utils.RespondError(w, http.StatusNotFound, "route not found")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, stops)
}

type updateRouteStatusRequest struct {
	Status string `json:"status"`
}

func (h *RouteHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var in updateRouteStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	route, err := h.svc.UpdateStatus(r.Context(), claims.UserID, claims.Role, r.PathValue("id"), in.Status)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrForbidden):
			utils.RespondError(w, http.StatusForbidden, "forbidden: insufficient role")
		case errors.Is(err, services.ErrNotFound):
			utils.RespondError(w, http.StatusNotFound, "route not found")
		case errors.Is(err, services.ErrValidation):
			utils.RespondError(w, http.StatusBadRequest, err.Error())
		default:
			utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}
	utils.RespondData(w, http.StatusOK, route)
}
