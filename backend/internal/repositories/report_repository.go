package repositories

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

const reportCols = `id, waste_point_id, reported_by, problem_type, description, photo_url, priority, status, created_at`

const reportOrder = `ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC`

type ReportRepository struct {
	pool *pgxpool.Pool
}

func NewReportRepository(pool *pgxpool.Pool) *ReportRepository {
	return &ReportRepository{pool: pool}
}

func (r *ReportRepository) Create(ctx context.Context, rep *models.WasteReport) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO waste_reports (waste_point_id, reported_by, problem_type, description, photo_url, priority, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at`,
		rep.WastePointID, rep.ReportedBy, rep.ProblemType, rep.Description, rep.PhotoURL, rep.Priority, rep.Status,
	).Scan(&rep.ID, &rep.CreatedAt)
}

func (r *ReportRepository) List(ctx context.Context, status string) ([]models.WasteReport, error) {
	query := `SELECT ` + reportCols + ` FROM waste_reports`
	args := []any{}
	if status != "" {
		query += ` WHERE status = $1`
		args = append(args, status)
	}
	query += ` ` + reportOrder
	return r.list(ctx, query, args...)
}

func (r *ReportRepository) ListByUser(ctx context.Context, userID string) ([]models.WasteReport, error) {
	return r.list(ctx,
		`SELECT `+reportCols+` FROM waste_reports WHERE reported_by = $1 `+reportOrder, userID)
}

func (r *ReportRepository) list(ctx context.Context, query string, args ...any) ([]models.WasteReport, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reports := []models.WasteReport{}
	for rows.Next() {
		rep := &models.WasteReport{}
		if err := rows.Scan(&rep.ID, &rep.WastePointID, &rep.ReportedBy, &rep.ProblemType, &rep.Description, &rep.PhotoURL, &rep.Priority, &rep.Status, &rep.CreatedAt); err != nil {
			return nil, err
		}
		reports = append(reports, *rep)
	}
	return reports, rows.Err()
}
