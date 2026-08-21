package repositories

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

type SmartBinRepository struct {
	pool *pgxpool.Pool
}

func NewSmartBinRepository(pool *pgxpool.Pool) *SmartBinRepository {
	return &SmartBinRepository{pool: pool}
}

func (r *SmartBinRepository) CreateReading(ctx context.Context, reading *models.SmartBinReading) error {
	comp, err := json.Marshal(reading.Composition)
	if err != nil {
		return err
	}
	return r.pool.QueryRow(ctx,
		`INSERT INTO smart_bin_readings (waste_point_id, total_kg, composition, primary_category, confidence, trigger_type, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at`,
		reading.WastePointID, reading.TotalKg, comp, reading.PrimaryCategory, reading.Confidence,
		reading.TriggerType, reading.Status,
	).Scan(&reading.ID, &reading.CreatedAt)
}

func (r *SmartBinRepository) SetBinEstimate(ctx context.Context, binID string, kg float64) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE waste_points SET current_estimated_kg = $2 WHERE id = $1`, binID, kg)
	return err
}

func (r *SmartBinRepository) LatestPendingByBin(ctx context.Context, binID string) (*models.SmartBinReading, error) {
	reading, err := r.getReading(ctx, `WHERE r.waste_point_id = $1 AND r.status = 'pending' ORDER BY r.created_at DESC LIMIT 1`, binID)
	if err != nil {
		return nil, err
	}
	if reading == nil {
		return nil, nil
	}
	return reading, nil
}

func (r *SmartBinRepository) ListBinReadings(ctx context.Context, binID string) ([]models.SmartBinReading, error) {
	rows, err := r.pool.Query(ctx, readingSelect+` WHERE r.waste_point_id = $1 ORDER BY r.created_at DESC LIMIT 20`, binID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanReadings(rows)
}

func (r *SmartBinRepository) ListReadings(ctx context.Context) ([]models.SmartBinReading, error) {
	rows, err := r.pool.Query(ctx, readingSelect+` ORDER BY r.created_at DESC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanReadings(rows)
}

const readingSelect = `
	SELECT r.id, r.waste_point_id, wp.name, COALESCE(wp.category, 'other'),
	       r.total_kg, r.composition, COALESCE(r.primary_category, ''), r.confidence,
	       r.trigger_type, r.status, r.created_at
	FROM smart_bin_readings r
	JOIN waste_points wp ON wp.id = r.waste_point_id`

func (r *SmartBinRepository) getReading(ctx context.Context, where string, args ...any) (*models.SmartBinReading, error) {
	row := r.pool.QueryRow(ctx, readingSelect+` `+where, args...)
	reading := &models.SmartBinReading{}
	var comp []byte
	if err := row.Scan(&reading.ID, &reading.WastePointID, &reading.WastePointName, &reading.Category,
		&reading.TotalKg, &comp, &reading.PrimaryCategory, &reading.Confidence,
		&reading.TriggerType, &reading.Status, &reading.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	reading.Composition = map[string]float64{}
	if len(comp) > 0 {
		_ = json.Unmarshal(comp, &reading.Composition)
	}
	return reading, nil
}

func scanReadings(rows pgx.Rows) ([]models.SmartBinReading, error) {
	readings := []models.SmartBinReading{}
	for rows.Next() {
		r := models.SmartBinReading{}
		var comp []byte
		if err := rows.Scan(&r.ID, &r.WastePointID, &r.WastePointName, &r.Category,
			&r.TotalKg, &comp, &r.PrimaryCategory, &r.Confidence,
			&r.TriggerType, &r.Status, &r.CreatedAt); err != nil {
			return nil, err
		}
		r.Composition = map[string]float64{}
		if len(comp) > 0 {
			_ = json.Unmarshal(comp, &r.Composition)
		}
		readings = append(readings, r)
	}
	return readings, rows.Err()
}

// ResolveOnCollection marks a bin's pending readings as collected and converts
// the latest reading's category composition into recycling material batches,
// linking the smart-bin waste into the material ledger (and EcoMarket trace).
func (r *SmartBinRepository) ResolveOnCollection(ctx context.Context, binID, collectionID string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx,
		`UPDATE smart_bin_readings SET status = $1 WHERE waste_point_id = $2 AND status = 'pending'`,
		models.ReadingStatusCollected, binID); err != nil {
		return err
	}

	var comp []byte
	err = tx.QueryRow(ctx,
		`SELECT composition FROM smart_bin_readings
		 WHERE waste_point_id = $1 AND status = 'collected'
		 ORDER BY created_at DESC LIMIT 1`, binID).Scan(&comp)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	if err == nil && len(comp) > 0 {
		composition := map[string]float64{}
		_ = json.Unmarshal(comp, &composition)
		for material, kg := range composition {
			if kg <= 0 {
				continue
			}
			if _, err := tx.Exec(ctx,
				`INSERT INTO material_processing (source_type, source_id, material, received_kg, status)
				 VALUES ('collection', $1, $2, $3, 'received')`,
				collectionID, material, kg); err != nil {
				return err
			}
		}
	}
	return tx.Commit(ctx)
}

func (r *SmartBinRepository) Analytics(ctx context.Context) (*models.SmartBinAnalytics, error) {
	a := &models.SmartBinAnalytics{}
	if err := r.pool.QueryRow(ctx,
		`SELECT
		    (SELECT count(*) FROM waste_points),
		    (SELECT count(DISTINCT waste_point_id) FROM smart_bin_readings),
		    (SELECT count(*) FROM waste_points WHERE status = 'critical'),
		    (SELECT count(*) FROM smart_bin_readings WHERE status = 'pending'),
		    (SELECT coalesce(sum(total_kg), 0) FROM smart_bin_readings WHERE status = 'pending')
		 `).Scan(&a.BinsMonitored, &a.BinsWithReading, &a.BinsFull, &a.PendingReadings, &a.TotalKg); err != nil {
		return nil, err
	}

	readings, err := r.ListReadings(ctx)
	if err != nil {
		return nil, err
	}
	a.Readings = readings

	agg := map[string]float64{}
	for _, rd := range readings {
		if rd.Status != models.ReadingStatusPending {
			continue
		}
		for cat, kg := range rd.Composition {
			agg[cat] += kg
		}
	}
	total := 0.0
	for _, kg := range agg {
		total += kg
	}
	for cat, kg := range agg {
		a.Composition = append(a.Composition, models.CategoryKg{
			Category: cat,
			Kg:       round1(kg),
			Percent:  round1(kg / total * 100),
		})
	}
	if total == 0 {
		for _, c := range a.Composition {
			c.Percent = 0
		}
	}
	return a, nil
}

func round1(v float64) float64 {
	return float64(int((v+0.05)*10)) / 10
}
