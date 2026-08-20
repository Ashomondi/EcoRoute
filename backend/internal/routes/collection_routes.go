package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterCollections(r *Router) {
	deps := r.Deps()
	collectionRepo := repositories.NewCollectionRepository(deps.DB)
	truckRepo := repositories.NewTruckRepository(deps.DB)
	wasteRepo := repositories.NewWasteRepository(deps.DB)
	collectionSvc := services.NewCollectionService(collectionRepo, truckRepo, wasteRepo)
	h := handlers.NewCollectionHandler(collectionSvc)

	auth := middleware.RequireAuth(deps.Config)
	adminDriver := middleware.RequireRole(string(models.RoleAdmin), string(models.RoleDriver))

	r.Handle("GET", "/collections", auth(adminDriver(h.List)))
	r.Handle("POST", "/collections/{wastePointId}", auth(adminDriver(h.MarkCollected)))
}
