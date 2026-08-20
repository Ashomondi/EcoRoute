package repositories

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

const truckCols = `id, registration_number, capacity_kg, driver_id, current_lat, current_lng, status, created_at`

type TruckRepository struct {
	pool *pgxpool.Pool
}

func NewTruckRepository(pool *pgxpool.Pool) *TruckRepository {
	return &TruckRepository{pool: pool}
}

func (r *TruckRepository) Create(ctx context.Context, t *models.Truck) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO trucks (registration_number, capacity_kg, driver_id, current_lat, current_lng, status)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, created_at`,
		t.RegistrationNumber, t.CapacityKg, t.DriverID, t.CurrentLat, t.CurrentLng, t.Status,
	).Scan(&t.ID, &t.CreatedAt)
}

func (r *TruckRepository) List(ctx context.Context) ([]models.Truck, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+truckCols+` FROM trucks ORDER BY registration_number`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	trucks := []models.Truck{}
	for rows.Next() {
		t, err := scanTruck(rows)
		if err != nil {
			return nil, err
		}
		trucks = append(trucks, *t)
	}
	return trucks, rows.Err()
}

func (r *TruckRepository) GetByID(ctx context.Context, id string) (*models.Truck, error) {
	return scanTruck(r.pool.QueryRow(ctx,
		`SELECT `+truckCols+` FROM trucks WHERE id = $1`, id))
}

func (r *TruckRepository) GetByDriver(ctx context.Context, driverID string) (*models.Truck, error) {
	return scanTruck(r.pool.QueryRow(ctx,
		`SELECT `+truckCols+` FROM trucks WHERE driver_id = $1`, driverID))
}

func (r *TruckRepository) Update(ctx context.Context, t *models.Truck) (*models.Truck, error) {
	return scanTruck(r.pool.QueryRow(ctx,
		`UPDATE trucks
		 SET registration_number = $2, capacity_kg = $3, current_lat = $4, current_lng = $5, status = $6
		 WHERE id = $1
		 RETURNING `+truckCols,
		t.ID, t.RegistrationNumber, t.CapacityKg, t.CurrentLat, t.CurrentLng, t.Status))
}

func (r *TruckRepository) ClearDriver(ctx context.Context, driverID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE trucks SET driver_id = NULL WHERE driver_id = $1`, driverID)
	return err
}

func (r *TruckRepository) SetDriver(ctx context.Context, truckID string, driverID *string) (*models.Truck, error) {
	return scanTruck(r.pool.QueryRow(ctx,
		`UPDATE trucks SET driver_id = $2 WHERE id = $1 RETURNING `+truckCols, truckID, driverID))
}

func scanTruck(row pgx.Row) (*models.Truck, error) {
	t := &models.Truck{}
	err := row.Scan(&t.ID, &t.RegistrationNumber, &t.CapacityKg, &t.DriverID, &t.CurrentLat, &t.CurrentLng, &t.Status, &t.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return t, nil
}
