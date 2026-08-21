package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type MaterialProcessingHandler struct {
	svc *services.MaterialProcessingService
}

func NewMaterialProcessingHandler(svc *services.MaterialProcessingService) *MaterialProcessingHandler {
	return &MaterialProcessingHandler{svc: svc}
}

func (h *MaterialProcessingHandler) CreateBatch(w http.ResponseWriter, r *http.Request) {
	var in models.MaterialBatchInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	batch, err := h.svc.CreateBatch(r.Context(), in)
	if err != nil {
		if errors.Is(err, services.ErrValidation) {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusCreated, batch)
}

func (h *MaterialProcessingHandler) ListBatches(w http.ResponseWriter, r *http.Request) {
	batches, err := h.svc.ListBatches(r.Context())
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, batches)
}

func (h *MaterialProcessingHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	var in models.MaterialStatusInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	batch, err := h.svc.UpdateStatus(r.Context(), r.PathValue("id"), in.Status)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrValidation):
			utils.RespondError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrNotFound):
			utils.RespondError(w, http.StatusNotFound, "batch not found")
		default:
			utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}
	utils.RespondData(w, http.StatusOK, batch)
}

func (h *MaterialProcessingHandler) Summary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.svc.Summary(r.Context())
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, summary)
}
