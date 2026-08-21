package repositories

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

const wastePointCols = `id, name, latitude, longitude, current_level_pct, status, last_collected_at, created_at,
	COALESCE(category, '') AS category, COALESCE(max_capacity_kg, 0) AS max_capacity_kg, COALESCE(current_estimated_kg, 0) AS current_estimated_kg`

type WasteRepository struct {
	pool *pgxpool.Pool
}

func NewWasteRepository(pool *pgxpool.Pool) *WasteRepository {
	return &WasteRepository{pool: pool}
}

func (r *WasteRepository) Create(ctx context.Context, wp *models.WastePoint) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO waste_points (name, latitude, longitude, current_level_pct, status, category, max_capacity_kg)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at`,
		wp.Name, wp.Latitude, wp.Longitude, wp.CurrentLevelPct, wp.Status, wp.Category, wp.MaxCapacityKg,
	).Scan(&wp.ID, &wp.CreatedAt)
}

func (r *WasteRepository) List(ctx context.Context) ([]models.WastePoint, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+wastePointCols+` FROM waste_points ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	points := []models.WastePoint{}
	for rows.Next() {
		wp, err := scanWastePoint(rows)
		if err != nil {
			return nil, err
		}
		points = append(points, *wp)
	}
	return points, rows.Err()
}

func (r *WasteRepository) GetByID(ctx context.Context, id string) (*models.WastePoint, error) {
	return scanWastePoint(r.pool.QueryRow(ctx,
		`SELECT `+wastePointCols+` FROM waste_points WHERE id = $1`, id))
}

func (r *WasteRepository) GetMany(ctx context.Context, ids []string) (map[string]models.WastePoint, error) {
	byID := map[string]models.WastePoint{}
	if len(ids) == 0 {
		return byID, nil
	}

	rows, err := r.pool.Query(ctx,
		`SELECT `+wastePointCols+` FROM waste_points WHERE id::text = ANY($1)`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		wp, err := scanWastePoint(rows)
		if err != nil {
			return nil, err
		}
		byID[wp.ID] = *wp
	}
	return byID, rows.Err()
}

func (r *WasteRepository) ResetCollected(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE waste_points
		 SET current_level_pct = 0, status = $1, last_collected_at = now(), current_estimated_kg = 0
		 WHERE id = $2`,
		models.StatusOK, id)
	return err
}

func (r *WasteRepository) EscalatePriority(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE waste_points SET status = $1 WHERE id = $2 AND status <> $1`,
		models.StatusCritical, id)
	return err
}

func (r *WasteRepository) Update(ctx context.Context, wp *models.WastePoint) (*models.WastePoint, error) {
	return scanWastePoint(r.pool.QueryRow(ctx,
		`UPDATE waste_points
		 SET name = $2, latitude = $3, longitude = $4, current_level_pct = $5, status = $6,
		     category = $7, max_capacity_kg = $8
		 WHERE id = $1
		 RETURNING `+wastePointCols,
		wp.ID, wp.Name, wp.Latitude, wp.Longitude, wp.CurrentLevelPct, wp.Status, wp.Category, wp.MaxCapacityKg))
}

func (r *WasteRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM waste_points WHERE id = $1`, id)
	return err
}

func scanWastePoint(row pgx.Row) (*models.WastePoint, error) {
	wp := &models.WastePoint{}
	err := row.Scan(&wp.ID, &wp.Name, &wp.Latitude, &wp.Longitude, &wp.CurrentLevelPct, &wp.Status, &wp.LastCollectedAt, &wp.CreatedAt,
		&wp.Category, &wp.MaxCapacityKg, &wp.CurrentEstimatedKg)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return wp, nil
}
