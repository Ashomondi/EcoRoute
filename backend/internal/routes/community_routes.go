package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/services"
)

func RegisterCommunity(r *Router) {
	deps := r.Deps()
	communitySvc := services.NewCommunityService(deps.DB)
	h := handlers.NewCommunityHandler(communitySvc)

	auth := middleware.RequireAuth(deps.Config)

	r.Handle("GET", "/community/summary", auth(h.Summary))
	r.Handle("GET", "/community/activity", auth(h.Activity))
}
