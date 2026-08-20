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

type ReportHandler struct {
	svc *services.ReportService
}

func NewReportHandler(svc *services.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

func (h *ReportHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var in models.ReportInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	report, err := h.svc.CreateReport(r.Context(), claims.UserID, in)
	if err != nil {
		if errors.Is(err, services.ErrValidation) {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusCreated, report)
}

func (h *ReportHandler) List(w http.ResponseWriter, r *http.Request) {
	reports, err := h.svc.List(r.Context(), r.URL.Query().Get("status"))
	if err != nil {
		if errors.Is(err, services.ErrValidation) {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, reports)
}

func (h *ReportHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	reports, err := h.svc.ListForUser(r.Context(), claims.UserID)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, reports)
}
