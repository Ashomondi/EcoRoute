package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/services"
)

func RegisterAnalytics(r *Router) {
	deps := r.Deps()
	analyticsSvc := services.NewAnalyticsService(deps.DB)
	h := handlers.NewAnalyticsHandler(analyticsSvc)

	auth := middleware.RequireAuth(deps.Config)
	admin := middleware.RequireRole(string(models.RoleAdmin))

	r.Handle("GET", "/analytics/summary", auth(admin(h.Summary)))
	r.Handle("GET", "/analytics/trend", auth(admin(h.Trend)))
}
