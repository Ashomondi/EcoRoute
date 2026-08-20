package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterRoutes(r *Router) {
	deps := r.Deps()
	routeRepo := repositories.NewRouteRepository(deps.DB)
	truckRepo := repositories.NewTruckRepository(deps.DB)
	wasteRepo := repositories.NewWasteRepository(deps.DB)
	routeSvc := services.NewRouteService(routeRepo, truckRepo, wasteRepo)
	h := handlers.NewRouteHandler(routeSvc)

	auth := middleware.RequireAuth(deps.Config)
	admin := middleware.RequireRole(string(models.RoleAdmin))
	adminDriver := middleware.RequireRole(string(models.RoleAdmin), string(models.RoleDriver))

	r.Handle("POST", "/routes/optimize", auth(admin(h.Optimize)))
	r.Handle("GET", "/routes", auth(adminDriver(h.List)))
	r.Handle("GET", "/routes/{id}", auth(adminDriver(h.Get)))
	r.Handle("PUT", "/routes/{id}/status", auth(adminDriver(h.UpdateStatus)))
}
