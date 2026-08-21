package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type RecyclingHandler struct {
	svc *services.RecyclingService
}

func NewRecyclingHandler(svc *services.RecyclingService) *RecyclingHandler {
	return &RecyclingHandler{svc: svc}
}

func (h *RecyclingHandler) WasteTypes(w http.ResponseWriter, r *http.Request) {
	types, err := h.svc.WasteTypes(r.Context())
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, types)
}

func (h *RecyclingHandler) Recyclers(w http.ResponseWriter, r *http.Request) {
	lat, latOK := parseFloatQuery(r, "lat")
	lng, lngOK := parseFloatQuery(r, "lng")
	var latPtr, lngPtr *float64
	if latOK && lngOK {
		latPtr, lngPtr = &lat, &lng
	}
	var radius *float64
	if v, ok := parseFloatQuery(r, "radius_km"); ok {
		radius = &v
	}

	recyclers, err := h.svc.Recyclers(r.Context(), latPtr, lngPtr, radius, r.URL.Query().Get("type"))
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, recyclers)
}

func (h *RecyclingHandler) CreateRecycler(w http.ResponseWriter, r *http.Request) {
	var in models.RecyclerInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	rc, err := h.svc.CreateRecycler(r.Context(), in)
	if err != nil {
		if errors.Is(err, services.ErrValidation) {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusCreated, rc)
}

func (h *RecyclingHandler) UpdateRecycler(w http.ResponseWriter, r *http.Request) {
	var in models.RecyclerInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	rc, err := h.svc.UpdateRecycler(r.Context(), r.PathValue("id"), in)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrValidation):
			utils.RespondError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, services.ErrNotFound):
			utils.RespondError(w, http.StatusNotFound, "recycler not found")
		default:
			utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}
	utils.RespondData(w, http.StatusOK, rc)
}

func (h *RecyclingHandler) DeleteRecycler(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.DeleteRecycler(r.Context(), r.PathValue("id")); err != nil {
		if errors.Is(err, services.ErrNotFound) {
			utils.RespondError(w, http.StatusNotFound, "recycler not found")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *RecyclingHandler) CreateRecord(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var in models.RecycleInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	rec, err := h.svc.CreateRecord(r.Context(), claims.UserID, in)
	if err != nil {
		if errors.Is(err, services.ErrValidation) {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusCreated, rec)
}

func (h *RecyclingHandler) Records(w http.ResponseWriter, r *http.Request) {
	records, err := h.svc.Records(r.Context())
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, records)
}

func (h *RecyclingHandler) RecordsMine(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	records, err := h.svc.RecordsForUser(r.Context(), claims.UserID)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, records)
}

func (h *RecyclingHandler) Impact(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFrom(r)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	impact, err := h.svc.ImpactForUser(r.Context(), claims.UserID)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, impact)
}

func (h *RecyclingHandler) ImpactTotal(w http.ResponseWriter, r *http.Request) {
	impact, err := h.svc.ImpactTotal(r.Context())
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, impact)
}

func parseFloatQuery(r *http.Request, key string) (float64, bool) {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return 0, false
	}
	v, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return 0, false
	}
	return v, true
}
