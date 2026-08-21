package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type CollectionRequestHandler struct {
	svc *services.CollectionRequestService
}

func NewCollectionRequestHandler(svc *services.CollectionRequestService) *CollectionRequestHandler {
	return &CollectionRequestHandler{svc: svc}
}

func (h *CollectionRequestHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var in models.CollectionRequestInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req, err := h.svc.Create(r.Context(), claims.UserID, in)
	if err != nil {
		if errors.Is(err, services.ErrValidation) {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusCreated, req)
}

func (h *CollectionRequestHandler) List(w http.ResponseWriter, r *http.Request) {
	requests, err := h.svc.List(r.Context(), r.URL.Query().Get("status"))
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, requests)
}

func (h *CollectionRequestHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	requests, err := h.svc.ListForUser(r.Context(), claims.UserID)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, requests)
}

func (h *CollectionRequestHandler) Prioritize(w http.ResponseWriter, r *http.Request) {
	requests, err := h.svc.Prioritize(r.Context())
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, requests)
}

func (h *CollectionRequestHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	var in models.CollectionRequestStatusInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req, err := h.svc.UpdateStatus(r.Context(), r.PathValue("id"), in)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrValidation):
			utils.RespondError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrNotFound):
			utils.RespondError(w, http.StatusNotFound, "collection request not found")
		default:
			utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}
	utils.RespondData(w, http.StatusOK, req)
}
