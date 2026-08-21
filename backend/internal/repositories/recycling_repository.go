package repositories

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

const recyclerCols = `id, name, address, phone, website, latitude, longitude, accepted_types, status, created_at`

const recordCols = `rr.id, rr.user_id, rr.waste_type, wt.name, rr.estimated_kg, rr.recycler_id, rc.name, rr.photo_url, rr.created_at`

type RecyclingRepository struct {
	pool *pgxpool.Pool
}

func NewRecyclingRepository(pool *pgxpool.Pool) *RecyclingRepository {
	return &RecyclingRepository{pool: pool}
}

func (r *RecyclingRepository) ListWasteTypes(ctx context.Context) ([]models.WasteType, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT slug, name, recyclable, co2_per_kg, energy_kwh_per_kg, preparation, guide, sort_order
		 FROM waste_types ORDER BY sort_order`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	types := []models.WasteType{}
	for rows.Next() {
		wt := models.WasteType{}
		var guide []byte
		if err := rows.Scan(&wt.Slug, &wt.Name, &wt.Recyclable, &wt.CO2PerKg, &wt.EnergyKwhPerKg, &wt.Preparation, &guide, &wt.SortOrder); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(guide, &wt.Guide); err != nil {
			return nil, err
		}
		types = append(types, wt)
	}
	return types, rows.Err()
}

func (r *RecyclingRepository) GetWasteType(ctx context.Context, slug string) (*models.WasteType, error) {
	wt := &models.WasteType{}
	var guide []byte
	err := r.pool.QueryRow(ctx,
		`SELECT slug, name, recyclable, co2_per_kg, energy_kwh_per_kg, preparation, guide, sort_order
		 FROM waste_types WHERE slug = $1`, slug,
	).Scan(&wt.Slug, &wt.Name, &wt.Recyclable, &wt.CO2PerKg, &wt.EnergyKwhPerKg, &wt.Preparation, &guide, &wt.SortOrder)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(guide, &wt.Guide); err != nil {
		return nil, err
	}
	return wt, nil
}

func (r *RecyclingRepository) ListRecyclers(ctx context.Context) ([]models.Recycler, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+recyclerCols+` FROM recyclers ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	recyclers := []models.Recycler{}
	for rows.Next() {
		rc := models.Recycler{}
		if err := rows.Scan(&rc.ID, &rc.Name, &rc.Address, &rc.Phone, &rc.Website, &rc.Latitude, &rc.Longitude, &rc.AcceptedTypes, &rc.Status, &rc.CreatedAt); err != nil {
			return nil, err
		}
		recyclers = append(recyclers, rc)
	}
	return recyclers, rows.Err()
}

func (r *RecyclingRepository) GetRecycler(ctx context.Context, id string) (*models.Recycler, error) {
	rc := &models.Recycler{}
	err := r.pool.QueryRow(ctx,
		`SELECT `+recyclerCols+` FROM recyclers WHERE id = $1`, id,
	).Scan(&rc.ID, &rc.Name, &rc.Address, &rc.Phone, &rc.Website, &rc.Latitude, &rc.Longitude, &rc.AcceptedTypes, &rc.Status, &rc.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return rc, nil
}

func (r *RecyclingRepository) CreateRecycler(ctx context.Context, rc *models.Recycler) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO recyclers (name, address, phone, website, latitude, longitude, accepted_types, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, created_at`,
		rc.Name, rc.Address, rc.Phone, rc.Website, rc.Latitude, rc.Longitude, rc.AcceptedTypes, rc.Status,
	).Scan(&rc.ID, &rc.CreatedAt)
}

func (r *RecyclingRepository) UpdateRecycler(ctx context.Context, rc *models.Recycler) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE recyclers
		 SET name = $2, address = $3, phone = $4, website = $5, latitude = $6, longitude = $7, accepted_types = $8, status = $9
		 WHERE id = $1`,
		rc.ID, rc.Name, rc.Address, rc.Phone, rc.Website, rc.Latitude, rc.Longitude, rc.AcceptedTypes, rc.Status)
	return err
}

func (r *RecyclingRepository) DeleteRecycler(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM recyclers WHERE id = $1`, id)
	return err
}

func (r *RecyclingRepository) CreateRecord(ctx context.Context, rec *models.RecyclingRecord) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO recycling_records (user_id, waste_type, estimated_kg, recycler_id, photo_url)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, created_at`,
		rec.UserID, rec.WasteType, rec.EstimatedKg, rec.RecyclerID, rec.PhotoURL,
	).Scan(&rec.ID, &rec.CreatedAt)
}

func (r *RecyclingRepository) listRecords(ctx context.Context, query string, args ...any) ([]models.RecyclingRecord, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []models.RecyclingRecord{}
	for rows.Next() {
		rec := models.RecyclingRecord{}
		if err := rows.Scan(&rec.ID, &rec.UserID, &rec.WasteType, &rec.WasteName, &rec.EstimatedKg, &rec.RecyclerID, &rec.RecyclerName, &rec.PhotoURL, &rec.CreatedAt); err != nil {
			return nil, err
		}
		records = append(records, rec)
	}
	return records, rows.Err()
}

func (r *RecyclingRepository) ListRecords(ctx context.Context) ([]models.RecyclingRecord, error) {
	return r.listRecords(ctx,
		`SELECT `+recordCols+`
		 FROM recycling_records rr
		 JOIN waste_types wt ON wt.slug = rr.waste_type
		 LEFT JOIN recyclers rc ON rc.id = rr.recycler_id
		 ORDER BY rr.created_at DESC`)
}

func (r *RecyclingRepository) ListRecordsByUser(ctx context.Context, userID string) ([]models.RecyclingRecord, error) {
	return r.listRecords(ctx,
		`SELECT `+recordCols+`
		 FROM recycling_records rr
		 JOIN waste_types wt ON wt.slug = rr.waste_type
		 LEFT JOIN recyclers rc ON rc.id = rr.recycler_id
		 WHERE rr.user_id = $1
		 ORDER BY rr.created_at DESC`, userID)
}

// ImpactByType returns recycling impact grouped by waste type. Pass a nil
// userID to aggregate across all users, or a userID to scope to one resident.
func (r *RecyclingRepository) ImpactByType(ctx context.Context, userID *string) ([]models.TypeImpact, error) {
	query := `SELECT wt.slug, wt.name, count(*)::int,
	             coalesce(sum(rr.estimated_kg), 0),
	             coalesce(sum(rr.estimated_kg * wt.co2_per_kg), 0),
	             coalesce(sum(rr.estimated_kg * wt.energy_kwh_per_kg), 0)
	          FROM recycling_records rr
	          JOIN waste_types wt ON wt.slug = rr.waste_type`
	args := []any{}
	if userID != nil {
		query += ` WHERE rr.user_id = $1`
		args = append(args, *userID)
	}
	query += ` GROUP BY wt.slug, wt.name ORDER BY wt.sort_order`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	impact := []models.TypeImpact{}
	for rows.Next() {
		ti := models.TypeImpact{}
		if err := rows.Scan(&ti.Slug, &ti.Name, &ti.Count, &ti.Kg, &ti.CO2SavedKg, &ti.EnergySavedKwh); err != nil {
			return nil, err
		}
		impact = append(impact, ti)
	}
	return impact, rows.Err()
}

// RecyclingTotals returns the total recycled kg and CO2 avoided across all
// recycling records, used by the analytics dashboard.
func (r *RecyclingRepository) RecyclingTotals(ctx context.Context) (kg, co2Kg float64, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT coalesce(sum(rr.estimated_kg), 0),
		        coalesce(sum(rr.estimated_kg * wt.co2_per_kg), 0)
		 FROM recycling_records rr
		 JOIN waste_types wt ON wt.slug = rr.waste_type`,
	).Scan(&kg, &co2Kg)
	return kg, co2Kg, err
}
