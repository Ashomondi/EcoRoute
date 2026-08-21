package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

const requestCols = `cr.id, cr.requester_id, u.name, cr.requester_type, cr.waste_type, wt.name,
	cr.estimated_kg, cr.latitude, cr.longitude, cr.address, cr.notes, cr.status,
	cr.priority_score, cr.route_id, cr.collected_at, cr.created_at`

type CollectionRequestRepository struct {
	pool *pgxpool.Pool
}

func NewCollectionRequestRepository(pool *pgxpool.Pool) *CollectionRequestRepository {
	return &CollectionRequestRepository{pool: pool}
}

func scanRequest(row pgx.Row) (*models.CollectionRequest, error) {
	req := &models.CollectionRequest{}
	err := row.Scan(&req.ID, &req.RequesterID, &req.RequesterName, &req.RequesterType, &req.WasteType,
		&req.WasteName, &req.EstimatedKg, &req.Latitude, &req.Longitude, &req.Address, &req.Notes,
		&req.Status, &req.PriorityScore, &req.RouteID, &req.CollectedAt, &req.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return req, nil
}

func (r *CollectionRequestRepository) list(ctx context.Context, query string, args ...any) ([]models.CollectionRequest, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := []models.CollectionRequest{}
	for rows.Next() {
		req, err := scanRequest(rows)
		if err != nil {
			return nil, err
		}
		requests = append(requests, *req)
	}
	return requests, rows.Err()
}

func (r *CollectionRequestRepository) Create(ctx context.Context, req *models.CollectionRequest) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO collection_requests
		   (requester_id, requester_type, waste_type, estimated_kg, latitude, longitude, address, notes, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id, created_at`,
		req.RequesterID, req.RequesterType, req.WasteType, req.EstimatedKg,
		req.Latitude, req.Longitude, req.Address, req.Notes, req.Status,
	).Scan(&req.ID, &req.CreatedAt)
}

func (r *CollectionRequestRepository) GetByID(ctx context.Context, id string) (*models.CollectionRequest, error) {
	return scanRequest(r.pool.QueryRow(ctx,
		`SELECT `+requestCols+` FROM collection_requests cr
		 JOIN waste_types wt ON wt.slug = cr.waste_type
		 JOIN users u ON u.id = cr.requester_id
		 WHERE cr.id = $1`, id))
}

func (r *CollectionRequestRepository) List(ctx context.Context, status string) ([]models.CollectionRequest, error) {
	query := `SELECT ` + requestCols + ` FROM collection_requests cr
		JOIN waste_types wt ON wt.slug = cr.waste_type
		JOIN users u ON u.id = cr.requester_id`
	args := []any{}
	if status != "" {
		query += ` WHERE cr.status = $1`
		args = append(args, status)
	}
	query += ` ORDER BY cr.priority_score DESC, cr.created_at DESC`
	return r.list(ctx, query, args...)
}

func (r *CollectionRequestRepository) ListByUser(ctx context.Context, userID string) ([]models.CollectionRequest, error) {
	return r.list(ctx,
		`SELECT `+requestCols+` FROM collection_requests cr
		 JOIN waste_types wt ON wt.slug = cr.waste_type
		 JOIN users u ON u.id = cr.requester_id
		 WHERE cr.requester_id = $1
		 ORDER BY cr.created_at DESC`, userID)
}

func (r *CollectionRequestRepository) ListActive(ctx context.Context) ([]models.CollectionRequest, error) {
	return r.list(ctx,
		`SELECT `+requestCols+` FROM collection_requests cr
		 JOIN waste_types wt ON wt.slug = cr.waste_type
		 JOIN users u ON u.id = cr.requester_id
		 WHERE cr.status IN ($1, $2)
		 ORDER BY cr.priority_score DESC, cr.created_at DESC`,
		models.RequestStatusPending, models.RequestStatusScheduled)
}

func (r *CollectionRequestRepository) UpdateScore(ctx context.Context, id string, score float64) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE collection_requests SET priority_score = $2 WHERE id = $1`, id, score)
	return err
}

func (r *CollectionRequestRepository) UpdateStatus(ctx context.Context, id, status string, routeID *string, collectedAt *time.Time) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE collection_requests SET status = $2, route_id = $3, collected_at = $4 WHERE id = $1`,
		id, status, routeID, collectedAt)
	return err
}
