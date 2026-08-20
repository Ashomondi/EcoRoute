package repositories

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

const wastePointCols = `id, name, latitude, longitude, current_level_pct, status, last_collected_at, created_at`

type WasteRepository struct {
	pool *pgxpool.Pool
}

func NewWasteRepository(pool *pgxpool.Pool) *WasteRepository {
	return &WasteRepository{pool: pool}
}

func (r *WasteRepository) Create(ctx context.Context, wp *models.WastePoint) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO waste_points (name, latitude, longitude, current_level_pct, status)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, created_at`,
		wp.Name, wp.Latitude, wp.Longitude, wp.CurrentLevelPct, wp.Status,
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

func (r *WasteRepository) Update(ctx context.Context, wp *models.WastePoint) (*models.WastePoint, error) {
	return scanWastePoint(r.pool.QueryRow(ctx,
		`UPDATE waste_points
		 SET name = $2, latitude = $3, longitude = $4, current_level_pct = $5, status = $6
		 WHERE id = $1
		 RETURNING `+wastePointCols,
		wp.ID, wp.Name, wp.Latitude, wp.Longitude, wp.CurrentLevelPct, wp.Status))
}

func scanWastePoint(row pgx.Row) (*models.WastePoint, error) {
	wp := &models.WastePoint{}
	err := row.Scan(&wp.ID, &wp.Name, &wp.Latitude, &wp.Longitude, &wp.CurrentLevelPct, &wp.Status, &wp.LastCollectedAt, &wp.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return wp, nil
}
