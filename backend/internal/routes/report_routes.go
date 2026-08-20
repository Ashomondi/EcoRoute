package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterReports(r *Router) {
	deps := r.Deps()
	reportRepo := repositories.NewReportRepository(deps.DB)
	wasteRepo := repositories.NewWasteRepository(deps.DB)
	reportSvc := services.NewReportService(reportRepo, wasteRepo)
	h := handlers.NewReportHandler(reportSvc)

	auth := middleware.RequireAuth(deps.Config)
	admin := middleware.RequireRole(string(models.RoleAdmin))

	r.Handle("POST", "/reports", auth(h.Create))
	r.Handle("GET", "/reports", auth(admin(h.List)))
	r.Handle("GET", "/reports/mine", auth(h.ListMine))
}
