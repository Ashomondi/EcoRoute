package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/services"
)

func RegisterAuth(r *Router) {
	deps := r.Deps()
	users := repositories.NewUserRepository(deps.DB)
	authSvc := services.NewAuthService(users, deps.Config)
	h := handlers.NewAuthHandler(authSvc)

	r.Handle("POST", "/auth/register", h.Register)
	r.Handle("POST", "/auth/login", h.Login)
	r.Handle("POST", "/auth/admin/login", h.LoginAdmin)
}
