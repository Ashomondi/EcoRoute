package repositories

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

const collectionCols = `id, route_id, waste_point_id, truck_id, outcome, collected_at`

type CollectionRepository struct {
	pool *pgxpool.Pool
}

func NewCollectionRepository(pool *pgxpool.Pool) *CollectionRepository {
	return &CollectionRepository{pool: pool}
}

func (r *CollectionRepository) Create(ctx context.Context, rec *models.CollectionRecord) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO collection_records (route_id, waste_point_id, truck_id, outcome)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, collected_at`,
		rec.RouteID, rec.WastePointID, rec.TruckID, rec.Outcome,
	).Scan(&rec.ID, &rec.CollectedAt)
}

func (r *CollectionRepository) ListByTruck(ctx context.Context, truckID string) ([]models.CollectionRecord, error) {
	return r.list(ctx, `SELECT `+collectionCols+` FROM collection_records WHERE truck_id = $1 ORDER BY collected_at DESC`, truckID)
}

func (r *CollectionRepository) ListAll(ctx context.Context) ([]models.CollectionRecord, error) {
	return r.list(ctx, `SELECT `+collectionCols+` FROM collection_records ORDER BY collected_at DESC`)
}

func (r *CollectionRepository) GetActiveRouteID(ctx context.Context, truckID string) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx,
		`SELECT id FROM routes WHERE truck_id = $1 AND status IN ('planned', 'active')
		 ORDER BY created_at DESC LIMIT 1`, truckID).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	return id, err
}

func (r *CollectionRepository) GetRouteTruck(ctx context.Context, routeID string) (string, error) {
	var truckID string
	err := r.pool.QueryRow(ctx,
		`SELECT truck_id FROM routes WHERE id = $1`, routeID).Scan(&truckID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	return truckID, err
}

func (r *CollectionRepository) RouteContainsPoint(ctx context.Context, routeID, wastePointID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS (
			SELECT 1 FROM routes WHERE id = $1 AND ordered_point_ids @> to_jsonb($2::text)
		 )`, routeID, wastePointID).Scan(&exists)
	return exists, err
}

func (r *CollectionRepository) list(ctx context.Context, query string, args ...any) ([]models.CollectionRecord, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []models.CollectionRecord{}
	for rows.Next() {
		rec := &models.CollectionRecord{}
		if err := rows.Scan(&rec.ID, &rec.RouteID, &rec.WastePointID, &rec.TruckID, &rec.Outcome, &rec.CollectedAt); err != nil {
			return nil, err
		}
		records = append(records, *rec)
	}
	return records, rows.Err()
}
