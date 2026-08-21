package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterRecycling(r *Router) {
	deps := r.Deps()
	recyclingRepo := repositories.NewRecyclingRepository(deps.DB)
	recyclingSvc := services.NewRecyclingService(recyclingRepo)
	h := handlers.NewRecyclingHandler(recyclingSvc)

	auth := middleware.RequireAuth(deps.Config)
	admin := middleware.RequireRole(string(models.RoleAdmin))

	r.Handle("GET", "/recycling/waste-types", auth(h.WasteTypes))
	r.Handle("GET", "/recycling/recyclers", auth(h.Recyclers))
	r.Handle("POST", "/recycling/recyclers", auth(admin(h.CreateRecycler)))
	r.Handle("PUT", "/recycling/recyclers/{id}", auth(admin(h.UpdateRecycler)))
	r.Handle("DELETE", "/recycling/recyclers/{id}", auth(admin(h.DeleteRecycler)))
	r.Handle("POST", "/recycling/records", auth(h.CreateRecord))
	r.Handle("GET", "/recycling/records", auth(admin(h.Records)))
	r.Handle("GET", "/recycling/records/mine", auth(h.RecordsMine))
	r.Handle("GET", "/recycling/impact", auth(h.Impact))
	r.Handle("GET", "/recycling/impact/total", auth(admin(h.ImpactTotal)))
}
