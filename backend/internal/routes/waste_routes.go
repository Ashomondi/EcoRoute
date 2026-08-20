package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterWaste(r *Router) {
	deps := r.Deps()
	repo := repositories.NewWasteRepository(deps.DB)
	svc := services.NewWasteService(repo, services.NewAIClient(deps.Config))
	h := handlers.NewWasteHandler(svc)

	auth := middleware.RequireAuth(deps.Config)
	admin := middleware.RequireRole(string(models.RoleAdmin))
	readers := middleware.RequireRole(string(models.RoleAdmin), string(models.RoleDriver), string(models.RoleCommunity))

	r.Handle("GET", "/waste-points", auth(readers(h.List)))
	r.Handle("GET", "/waste-points/{id}", auth(readers(h.Get)))
	r.Handle("POST", "/waste-points", auth(admin(h.Create)))
	r.Handle("PUT", "/waste-points/{id}", auth(admin(h.Update)))
}
