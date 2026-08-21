package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type CollectionHandler struct {
	svc *services.CollectionService
}

func NewCollectionHandler(svc *services.CollectionService) *CollectionHandler {
	return &CollectionHandler{svc: svc}
}

func (h *CollectionHandler) List(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	records, err := h.svc.ListForUser(r.Context(), claims.UserID, claims.Role)
	if err != nil {
		if errors.Is(err, services.ErrForbidden) {
			utils.RespondError(w, http.StatusForbidden, "forbidden: insufficient role")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, records)
}

type markCollectedRequest struct {
	Outcome string `json:"outcome"`
	RouteID string `json:"route_id"`
}

func (h *CollectionHandler) MarkCollected(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var in markCollectedRequest
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	rec, err := h.svc.MarkCollected(r.Context(), claims.UserID, claims.Role, r.PathValue("wastePointId"), in.Outcome, in.RouteID)
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
	utils.RespondData(w, http.StatusCreated, rec)
}
