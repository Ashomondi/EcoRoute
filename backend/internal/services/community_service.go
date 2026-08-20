package services

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

type CommunityService struct {
	pool *pgxpool.Pool
}

func NewCommunityService(pool *pgxpool.Pool) *CommunityService {
	return &CommunityService{pool: pool}
}

func (s *CommunityService) Summary(ctx context.Context, userID string) (*models.CommunitySummary, error) {
	summary := &models.CommunitySummary{}

	if err := s.pool.QueryRow(ctx,
		`SELECT count(*) FROM waste_reports WHERE reported_by = $1`, userID,
	).Scan(&summary.ReportsMade); err != nil {
		return nil, err
	}

	if err := s.pool.QueryRow(ctx,
		`SELECT coalesce(sum(cr.estimated_kg), 0)
		 FROM collection_records cr
		 JOIN waste_reports wr ON wr.waste_point_id = cr.waste_point_id
		 WHERE wr.reported_by = $1 AND cr.outcome = 'collected'`, userID,
	).Scan(&summary.WasteDivertedKg); err != nil {
		return nil, err
	}

	if err := s.pool.QueryRow(ctx,
		`SELECT count(*) FROM (SELECT reported_by, count(*) AS c FROM waste_reports GROUP BY reported_by) t
		 WHERE t.c > (SELECT count(*) FROM waste_reports WHERE reported_by = $1)`, userID,
	).Scan(&summary.Rank); err != nil {
		return nil, err
	}
	summary.Rank++

	if err := s.pool.QueryRow(ctx,
		`SELECT count(DISTINCT reported_by) FROM waste_reports`,
	).Scan(&summary.TotalReporters); err != nil {
		return nil, err
	}

	return summary, nil
}

func (s *CommunityService) Activity(ctx context.Context, limit int) ([]models.ActivityItem, error) {
	if limit <= 0 || limit > 50 {
		limit = 10
	}

	rows, err := s.pool.Query(ctx,
		`SELECT type, message, created_at FROM (
			SELECT 'collection' AS type, wp.name || ' collected' AS message, cr.collected_at AS created_at
			FROM collection_records cr
			JOIN waste_points wp ON wp.id = cr.waste_point_id
			WHERE cr.outcome = 'collected'
			UNION ALL
			SELECT 'report', wr.problem_type || ' reported at ' || coalesce(wp.name, 'unknown location'), wr.created_at
			FROM waste_reports wr
			LEFT JOIN waste_points wp ON wp.id = wr.waste_point_id
		) feed ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.ActivityItem{}
	for rows.Next() {
		item := models.ActivityItem{}
		if err := rows.Scan(&item.Type, &item.Message, &item.Time); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
