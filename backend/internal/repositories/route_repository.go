package repositories

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

const routeCols = `id, truck_id, ordered_point_ids, distance_km, baseline_distance_km, estimated_fuel_l, estimated_minutes, status, created_at`

type RouteRepository struct {
	pool *pgxpool.Pool
}

func NewRouteRepository(pool *pgxpool.Pool) *RouteRepository {
	return &RouteRepository{pool: pool}
}

func (r *RouteRepository) Save(ctx context.Context, route *models.Route) error {
	pointsJSON, err := json.Marshal(route.OrderedPointIDs)
	if err != nil {
		return err
	}
	return r.pool.QueryRow(ctx,
		`INSERT INTO routes (truck_id, ordered_point_ids, distance_km, baseline_distance_km, estimated_fuel_l, estimated_minutes, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at`,
		route.TruckID, string(pointsJSON), route.DistanceKm, route.BaselineDistanceKm, route.EstimatedFuelL, route.EstimatedMinutes, route.Status,
	).Scan(&route.ID, &route.CreatedAt)
}

func (r *RouteRepository) GetByID(ctx context.Context, id string) (*models.Route, error) {
	return scanRoute(r.pool.QueryRow(ctx,
		`SELECT `+routeCols+` FROM routes WHERE id = $1`, id))
}

func (r *RouteRepository) List(ctx context.Context) ([]models.Route, error) {
	return r.list(ctx, `SELECT `+routeCols+` FROM routes ORDER BY created_at DESC`)
}

func (r *RouteRepository) ListByTruck(ctx context.Context, truckID string) ([]models.Route, error) {
	return r.list(ctx, `SELECT `+routeCols+` FROM routes WHERE truck_id = $1 ORDER BY created_at DESC`, truckID)
}

func (r *RouteRepository) UpdateStatus(ctx context.Context, id, status string) (*models.Route, error) {
	return scanRoute(r.pool.QueryRow(ctx,
		`UPDATE routes SET status = $2 WHERE id = $1 RETURNING `+routeCols, id, status))
}

func (r *RouteRepository) list(ctx context.Context, query string, args ...any) ([]models.Route, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	routes := []models.Route{}
	for rows.Next() {
		route, err := scanRoute(rows)
		if err != nil {
			return nil, err
		}
		routes = append(routes, *route)
	}
	return routes, rows.Err()
}

func scanRoute(row pgx.Row) (*models.Route, error) {
	route := &models.Route{}
	var points []byte
	err := row.Scan(&route.ID, &route.TruckID, &points, &route.DistanceKm, &route.BaselineDistanceKm, &route.EstimatedFuelL, &route.EstimatedMinutes, &route.Status, &route.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if len(points) > 0 {
		if err := json.Unmarshal(points, &route.OrderedPointIDs); err != nil {
			return nil, err
		}
	}
	return route, nil
}
