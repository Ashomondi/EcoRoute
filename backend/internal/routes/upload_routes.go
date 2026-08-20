package routes

import (
	"ecoroute/backend/internal/handlers"
	"ecoroute/backend/internal/middleware"
)

func RegisterUploads(r *Router) {
	deps := r.Deps()
	h := handlers.NewUploadHandler(deps.Config)
	auth := middleware.RequireAuth(deps.Config)

	r.Handle("POST", "/uploads", auth(h.Upload))
}
