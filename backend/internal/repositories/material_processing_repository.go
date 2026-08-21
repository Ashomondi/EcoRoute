package repositories

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

type MaterialProcessingRepository struct {
	pool *pgxpool.Pool
}

func NewMaterialProcessingRepository(pool *pgxpool.Pool) *MaterialProcessingRepository {
	return &MaterialProcessingRepository{pool: pool}
}

func (r *MaterialProcessingRepository) CreateBatch(ctx context.Context, b *models.MaterialBatch) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO material_processing (source_type, source_id, material, received_kg, status)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, created_at, updated_at`,
		b.SourceType, b.SourceID, b.Material, b.ReceivedKg, b.Status,
	).Scan(&b.ID, &b.CreatedAt, &b.UpdatedAt)
}

func (r *MaterialProcessingRepository) GetBatch(ctx context.Context, id string) (*models.MaterialBatch, error) {
	b := &models.MaterialBatch{}
	err := r.pool.QueryRow(ctx,
		`SELECT mp.id, mp.source_type, mp.source_id, mp.material, wt.name,
		        mp.received_kg, mp.sorted_kg, mp.recycled_kg, mp.status, mp.created_at, mp.updated_at
		 FROM material_processing mp
		 JOIN waste_types wt ON wt.slug = mp.material
		 WHERE mp.id = $1`, id,
	).Scan(&b.ID, &b.SourceType, &b.SourceID, &b.Material, &b.MaterialName,
		&b.ReceivedKg, &b.SortedKg, &b.RecycledKg, &b.Status, &b.CreatedAt, &b.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *MaterialProcessingRepository) ListBatches(ctx context.Context) ([]models.MaterialBatch, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT mp.id, mp.source_type, mp.source_id, mp.material, wt.name,
		        mp.received_kg, mp.sorted_kg, mp.recycled_kg, mp.status, mp.created_at, mp.updated_at
		 FROM material_processing mp
		 JOIN waste_types wt ON wt.slug = mp.material
		 ORDER BY mp.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	batches := []models.MaterialBatch{}
	for rows.Next() {
		b := models.MaterialBatch{}
		if err := rows.Scan(&b.ID, &b.SourceType, &b.SourceID, &b.Material, &b.MaterialName,
			&b.ReceivedKg, &b.SortedKg, &b.RecycledKg, &b.Status, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		batches = append(batches, b)
	}
	return batches, rows.Err()
}

func (r *MaterialProcessingRepository) UpdateStatus(ctx context.Context, id, status string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE material_processing
		 SET status = $2,
		     sorted_kg = CASE WHEN $2 = 'sorted' THEN received_kg ELSE sorted_kg END,
		     recycled_kg = CASE WHEN $2 IN ('recycled', 'sold') THEN received_kg ELSE recycled_kg END,
		     updated_at = now()
		 WHERE id = $1`, id, status)
	return err
}

func (r *MaterialProcessingRepository) MaterialValue(ctx context.Context) (float64, error) {
	var value float64
	err := r.pool.QueryRow(ctx,
		`SELECT coalesce(sum(mp.recycled_kg * wt.value_per_kg), 0)
		 FROM material_processing mp
		 JOIN waste_types wt ON wt.slug = mp.material`).Scan(&value)
	return value, err
}

func (r *MaterialProcessingRepository) Summary(ctx context.Context) (*models.RecyclingCenterSummary, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT material, material_name, batches, received_kg, sorted_kg, recycled_kg,
		        material_value, co2_saved_kg, energy_saved_kwh
		 FROM material_value_summary`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	summary := &models.RecyclingCenterSummary{ByMaterial: []models.MaterialValueRow{}}
	for rows.Next() {
		row := models.MaterialValueRow{}
		if err := rows.Scan(&row.Material, &row.MaterialName, &row.Batches, &row.ReceivedKg,
			&row.SortedKg, &row.RecycledKg, &row.MaterialValue, &row.CO2SavedKg, &row.EnergySavedKwh); err != nil {
			return nil, err
		}
		summary.ByMaterial = append(summary.ByMaterial, row)
		summary.TotalReceivedKg += row.ReceivedKg
		summary.TotalSortedKg += row.SortedKg
		summary.TotalRecycledKg += row.RecycledKg
		summary.TotalMaterialValue += row.MaterialValue
		summary.TotalCO2SavedKg += row.CO2SavedKg
		summary.TotalEnergySavedKwh += row.EnergySavedKwh
	}
	return summary, rows.Err()
}
