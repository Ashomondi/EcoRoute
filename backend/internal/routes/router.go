package routes

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/config"
	"ecoroute/backend/internal/middleware"
	"ecoroute/backend/internal/utils"
)

type Deps struct {
	Config *config.Config
	DB     *pgxpool.Pool
}

type Router struct {
	mux  *http.ServeMux
	deps *Deps
}

func NewRouter(deps *Deps) *Router {
	r := &Router{mux: http.NewServeMux(), deps: deps}

	r.mux.HandleFunc("GET /health", func(w http.ResponseWriter, req *http.Request) {
		utils.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	RegisterAuth(r)

	return r
}

func (r *Router) Handle(method, pattern string, h http.HandlerFunc) {
	r.mux.HandleFunc(method+" "+pattern, h)
}

func (r *Router) Deps() *Deps {
	return r.deps
}

func (r *Router) Handler() http.Handler {
	return middleware.CORS(middleware.Logging(middleware.Recovery(r.mux)))
}
