package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type WasteHandler struct {
	svc *services.WasteService
}

func NewWasteHandler(svc *services.WasteService) *WasteHandler {
	return &WasteHandler{svc: svc}
}

func (h *WasteHandler) List(w http.ResponseWriter, r *http.Request) {
	points, err := h.svc.List(r.Context())
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, points)
}

func (h *WasteHandler) Get(w http.ResponseWriter, r *http.Request) {
	point, err := h.svc.GetByIDWithPrediction(r.Context(), r.PathValue("id"))
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			utils.RespondError(w, http.StatusNotFound, "waste point not found")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, point)
}

func (h *WasteHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in models.WastePointInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	point, err := h.svc.Create(r.Context(), in)
	if err != nil {
		if errors.Is(err, services.ErrValidation) {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusCreated, point)
}

func (h *WasteHandler) Update(w http.ResponseWriter, r *http.Request) {
	var in models.WastePointInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	point, err := h.svc.Update(r.Context(), r.PathValue("id"), in)
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
	utils.RespondData(w, http.StatusOK, point)
}

func (h *WasteHandler) Delete(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.Delete(r.Context(), r.PathValue("id")); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			utils.RespondError(w, http.StatusNotFound, "waste point not found")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
