package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type SmartBinHandler struct {
	svc *services.SmartBinService
}

func NewSmartBinHandler(svc *services.SmartBinService) *SmartBinHandler {
	return &SmartBinHandler{svc: svc}
}

func (h *SmartBinHandler) Read(w http.ResponseWriter, r *http.Request) {
	var in models.SmartBinReadInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	reading, err := h.svc.ReadBin(r.Context(), r.PathValue("id"), in.Trigger)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrValidation):
			utils.RespondError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrNotFound):
			utils.RespondError(w, http.StatusNotFound, "waste point not found")
		default:
			utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}
	utils.RespondData(w, http.StatusCreated, reading)
}

func (h *SmartBinHandler) BinReadings(w http.ResponseWriter, r *http.Request) {
	readings, err := h.svc.ListBinReadings(r.Context(), r.PathValue("id"))
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, readings)
}

func (h *SmartBinHandler) ListReadings(w http.ResponseWriter, r *http.Request) {
	readings, err := h.svc.ListReadings(r.Context())
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, readings)
}

func (h *SmartBinHandler) Analytics(w http.ResponseWriter, r *http.Request) {
	analytics, err := h.svc.Analytics(r.Context())
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, analytics)
}
