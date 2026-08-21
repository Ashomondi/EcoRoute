package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterCollectionRequests(r *Router) {
	deps := r.Deps()
	reqRepo := repositories.NewCollectionRequestRepository(deps.DB)
	trucksRepo := repositories.NewTruckRepository(deps.DB)
	reqSvc := services.NewCollectionRequestService(reqRepo, trucksRepo)
	h := handlers.NewCollectionRequestHandler(reqSvc)

	auth := middleware.RequireAuth(deps.Config)
	admin := middleware.RequireRole(string(models.RoleAdmin))

	r.Handle("POST", "/collection-requests", auth(h.Create))
	r.Handle("GET", "/collection-requests", auth(admin(h.List)))
	r.Handle("GET", "/collection-requests/mine", auth(h.ListMine))
	r.Handle("GET", "/collection-requests/prioritize", auth(admin(h.Prioritize)))
	r.Handle("PUT", "/collection-requests/{id}/status", auth(admin(h.UpdateStatus)))
}
