package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterSmartBins(r *Router) {
	deps := r.Deps()
	binRepo := repositories.NewSmartBinRepository(deps.DB)
	wasteRepo := repositories.NewWasteRepository(deps.DB)
	recyclingRepo := repositories.NewRecyclingRepository(deps.DB)
	binSvc := services.NewSmartBinService(binRepo, wasteRepo, recyclingRepo, services.NewAIClient(deps.Config))
	h := handlers.NewSmartBinHandler(binSvc)

	auth := middleware.RequireAuth(deps.Config)
	admin := middleware.RequireRole(string(models.RoleAdmin))
	adminDriver := middleware.RequireRole(string(models.RoleAdmin), string(models.RoleDriver))
	readers := middleware.RequireRole(string(models.RoleAdmin), string(models.RoleDriver), string(models.RoleCommunity))

	r.Handle("POST", "/waste-points/{id}/read", auth(adminDriver(h.Read)))
	r.Handle("GET", "/waste-points/{id}/readings", auth(readers(h.BinReadings)))
	r.Handle("GET", "/smart-bins/readings", auth(admin(h.ListReadings)))
	r.Handle("GET", "/smart-bins/analytics", auth(admin(h.Analytics)))
}
