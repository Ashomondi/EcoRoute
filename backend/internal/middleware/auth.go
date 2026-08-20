package middleware

import (
	"context"
	"net/http"
	"strings"

	"ecoroute/backend/config"
	"ecoroute/backend/internal/utils"
)

type contextKey string

const claimsKey contextKey = "claims"

func RequireAuth(cfg *config.Config) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				utils.RespondError(w, http.StatusUnauthorized, "missing bearer token")
				return
			}
			claims, err := utils.ParseToken(cfg.JWTSecret, strings.TrimPrefix(header, "Bearer "))
			if err != nil {
				utils.RespondError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}
			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next(w, r.WithContext(ctx))
		}
	}
}

func RequireRole(roles ...string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(claimsKey).(*utils.Claims)
			if !ok {
				utils.RespondError(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			for _, role := range roles {
				if claims.Role == role {
					next(w, r)
					return
				}
			}
			utils.RespondError(w, http.StatusForbidden, "forbidden: insufficient role")
		}
	}
}

func ClaimsFrom(r *http.Request) (*utils.Claims, bool) {
	claims, ok := r.Context().Value(claimsKey).(*utils.Claims)
	return claims, ok
}
