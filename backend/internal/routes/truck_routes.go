package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterTrucks(r *Router) {
	deps := r.Deps()
	truckRepo := repositories.NewTruckRepository(deps.DB)
	userRepo := repositories.NewUserRepository(deps.DB)
	truckSvc := services.NewTruckService(truckRepo, userRepo)
	h := handlers.NewTruckHandler(truckSvc)

	auth := middleware.RequireAuth(deps.Config)
	admin := middleware.RequireRole(string(models.RoleAdmin))
	adminDriver := middleware.RequireRole(string(models.RoleAdmin), string(models.RoleDriver))

	r.Handle("GET", "/trucks", auth(adminDriver(h.List)))
	r.Handle("GET", "/trucks/{id}", auth(adminDriver(h.Get)))
	r.Handle("POST", "/trucks", auth(admin(h.Create)))
	r.Handle("PUT", "/trucks/{id}", auth(admin(h.Update)))
	r.Handle("PUT", "/trucks/{id}/driver", auth(admin(h.AssignDriver)))
	r.Handle("DELETE", "/trucks/{id}", auth(admin(h.Delete)))
}
