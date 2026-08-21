package services

import (
	"context"
	"encoding/json"
	"sort"

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

// Collections returns the resident's upcoming scheduled collections (from
// planned/active routes) and the recent collection history for their area.
func (s *CommunityService) Collections(ctx context.Context, userID string) (*models.CommunityCollections, error) {
	related, err := s.reportedPointIDs(ctx, userID)
	if err != nil {
		return nil, err
	}

	wpByID, err := s.wastePointsByID(ctx)
	if err != nil {
		return nil, err
	}

	truckRegs, err := s.truckRegistrations(ctx)
	if err != nil {
		return nil, err
	}

	rows, err := s.pool.Query(ctx,
		`SELECT id, truck_id, ordered_point_ids, estimated_minutes, status
		 FROM routes WHERE status IN ($1, $2) ORDER BY created_at ASC`,
		models.RouteStatusPlanned, models.RouteStatusActive)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	upcoming := []models.ScheduledCollection{}
	seen := map[string]bool{}
	for rows.Next() {
		var routeID, truckID, status string
		var minutes int
		var pointsJSON []byte
		if err := rows.Scan(&routeID, &truckID, &pointsJSON, &minutes, &status); err != nil {
			return nil, err
		}
		var ids []string
		if err := json.Unmarshal(pointsJSON, &ids); err != nil {
			return nil, err
		}
		for i, pid := range ids {
			if seen[pid] {
				continue
			}
			wp, ok := wpByID[pid]
			if !ok {
				continue
			}
			seen[pid] = true
			upcoming = append(upcoming, models.ScheduledCollection{
				WastePointID:      pid,
				WastePointName:    wp.Name,
				Latitude:          wp.Latitude,
				Longitude:         wp.Longitude,
				CurrentLevelPct:   wp.CurrentLevelPct,
				Status:            wp.Status,
				RouteID:           routeID,
				RouteStatus:       status,
				Order:             i + 1,
				StopCount:         len(ids),
				EstimatedMinutes:  minutes,
				TruckRegistration: truckRegs[truckID],
				Related:           related[pid],
			})
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	sort.SliceStable(upcoming, func(i, j int) bool {
		a, b := upcoming[i], upcoming[j]
		if a.Related != b.Related {
			return a.Related
		}
		if ra, rb := statusRank(a.Status), statusRank(b.Status); ra != rb {
			return ra < rb
		}
		return a.Order < b.Order
	})

	pastRows, err := s.pool.Query(ctx,
		`SELECT cr.id, cr.waste_point_id, cr.outcome, cr.estimated_kg, cr.collected_at, wp.name
		 FROM collection_records cr
		 JOIN waste_points wp ON wp.id = cr.waste_point_id
		 ORDER BY cr.collected_at DESC
		 LIMIT 50`)
	if err != nil {
		return nil, err
	}
	defer pastRows.Close()

	past := []models.PastCollection{}
	for pastRows.Next() {
		item := models.PastCollection{}
		if err := pastRows.Scan(&item.ID, &item.WastePointID, &item.Outcome, &item.EstimatedKg, &item.CollectedAt, &item.WastePointName); err != nil {
			return nil, err
		}
		past = append(past, item)
	}
	if err := pastRows.Err(); err != nil {
		return nil, err
	}

	return &models.CommunityCollections{Upcoming: upcoming, Past: past}, nil
}

func (s *CommunityService) reportedPointIDs(ctx context.Context, userID string) (map[string]bool, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT DISTINCT waste_point_id FROM waste_reports WHERE reported_by = $1 AND waste_point_id IS NOT NULL`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	related := map[string]bool{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		related[id] = true
	}
	return related, rows.Err()
}

func (s *CommunityService) wastePointsByID(ctx context.Context) (map[string]models.WastePoint, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, name, latitude, longitude, current_level_pct, status FROM waste_points`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	byID := map[string]models.WastePoint{}
	for rows.Next() {
		wp := models.WastePoint{}
		if err := rows.Scan(&wp.ID, &wp.Name, &wp.Latitude, &wp.Longitude, &wp.CurrentLevelPct, &wp.Status); err != nil {
			return nil, err
		}
		byID[wp.ID] = wp
	}
	return byID, rows.Err()
}

func (s *CommunityService) truckRegistrations(ctx context.Context) (map[string]string, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, registration_number FROM trucks`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	regs := map[string]string{}
	for rows.Next() {
		var id, reg string
		if err := rows.Scan(&id, &reg); err != nil {
			return nil, err
		}
		regs[id] = reg
	}
	return regs, rows.Err()
}
