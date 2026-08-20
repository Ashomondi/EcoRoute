package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

type AuthHandler struct {
	svc *services.AuthService
}

func NewAuthHandler(svc *services.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var in models.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.svc.Register(r.Context(), in)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrEmailExists):
			utils.RespondError(w, http.StatusConflict, err.Error())
		case errors.Is(err, services.ErrInvalidRole), errors.Is(err, services.ErrValidation):
			utils.RespondError(w, http.StatusBadRequest, err.Error())
		default:
			utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}
	utils.RespondData(w, http.StatusCreated, result)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var in loginRequest
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.svc.Login(r.Context(), in.Email, in.Password)
	if err != nil {
		if errors.Is(err, services.ErrInvalidLogin) {
			utils.RespondError(w, http.StatusUnauthorized, "invalid email or password")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	utils.RespondData(w, http.StatusOK, result)
}
