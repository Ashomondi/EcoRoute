package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterRecyclingCenter(r *Router) {
	deps := r.Deps()
	processingRepo := repositories.NewMaterialProcessingRepository(deps.DB)
	recyclingRepo := repositories.NewRecyclingRepository(deps.DB)
	processingSvc := services.NewMaterialProcessingService(processingRepo, recyclingRepo)
	h := handlers.NewMaterialProcessingHandler(processingSvc)

	auth := middleware.RequireAuth(deps.Config)
	admin := middleware.RequireRole(string(models.RoleAdmin))

	r.Handle("POST", "/recycling-center/records", auth(admin(h.CreateBatch)))
	r.Handle("GET", "/recycling-center/records", auth(admin(h.ListBatches)))
	r.Handle("PUT", "/recycling-center/records/{id}/status", auth(admin(h.UpdateStatus)))
	r.Handle("GET", "/recycling-center/summary", auth(admin(h.Summary)))
}
