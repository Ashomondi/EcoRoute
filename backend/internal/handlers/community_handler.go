package handlers

import (
	"net/http"
	"strconv"

	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type CommunityHandler struct {
	svc *services.CommunityService
}

func NewCommunityHandler(svc *services.CommunityService) *CommunityHandler {
	return &CommunityHandler{svc: svc}
}

func (h *CommunityHandler) Summary(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	summary, err := h.svc.Summary(r.Context(), claims.UserID)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, summary)
}

func (h *CommunityHandler) Activity(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	items, err := h.svc.Activity(r.Context(), limit)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, items)
}

func (h *CommunityHandler) Collections(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	collections, err := h.svc.Collections(r.Context(), claims.UserID)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, collections)
}
