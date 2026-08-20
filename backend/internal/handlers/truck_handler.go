package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type TruckHandler struct {
	svc *services.TruckService
}

func NewTruckHandler(svc *services.TruckService) *TruckHandler {
	return &TruckHandler{svc: svc}
}

func (h *TruckHandler) List(w http.ResponseWriter, r *http.Request) {
	trucks, err := h.svc.List(r.Context())
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, trucks)
}

func (h *TruckHandler) Get(w http.ResponseWriter, r *http.Request) {
	truck, err := h.svc.GetByID(r.Context(), r.PathValue("id"))
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			utils.RespondError(w, http.StatusNotFound, "truck not found")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, truck)
}

func (h *TruckHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in models.TruckInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	truck, err := h.svc.Create(r.Context(), in)
	if err != nil {
		if errors.Is(err, services.ErrValidation) {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusCreated, truck)
}

func (h *TruckHandler) Update(w http.ResponseWriter, r *http.Request) {
	var in models.TruckInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	truck, err := h.svc.Update(r.Context(), r.PathValue("id"), in)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrValidation):
			utils.RespondError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrNotFound):
			utils.RespondError(w, http.StatusNotFound, "truck not found")
		default:
			utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}
	utils.RespondData(w, http.StatusOK, truck)
}

type assignDriverRequest struct {
	DriverID *string `json:"driver_id"`
}

func (h *TruckHandler) AssignDriver(w http.ResponseWriter, r *http.Request) {
	var in assignDriverRequest
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	truck, err := h.svc.AssignDriver(r.Context(), r.PathValue("id"), in.DriverID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrValidation):
			utils.RespondError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrNotFound):
			utils.RespondError(w, http.StatusNotFound, "truck not found")
		default:
			utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}
	utils.RespondData(w, http.StatusOK, truck)
}
