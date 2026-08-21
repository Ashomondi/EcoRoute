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
	RegisterWaste(r)
	RegisterTrucks(r)
	RegisterCollections(r)
	RegisterRoutes(r)
	RegisterReports(r)
	RegisterAnalytics(r)
	RegisterCommunity(r)
	RegisterUploads(r)
	RegisterRecycling(r)

	if deps.Config.UploadDir != "" && deps.Config.UploadURL != "" {
		fs := http.StripPrefix(deps.Config.UploadURL, http.FileServer(http.Dir(deps.Config.UploadDir)))
		r.mux.Handle(deps.Config.UploadURL+"/", fs)
	}

	return r
}

func (r *Router) Handle(method, pattern string, h http.HandlerFunc) {
	r.mux.HandleFunc(method+" "+pattern, h)
}

func (r *Router) Deps() *Deps {
	return r.deps
}

func (r *Router) Handler() http.Handler {
	return middleware.CORS(r.deps.Config.CORSAllowedOrigins,
		middleware.RateLimit(r.deps.Config.RateLimitRequests, r.deps.Config.RateLimitWindow)(
			middleware.Logging(middleware.Recovery(r.mux))))
}
