package main

import (
	"context"
	"errors"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/services"
	"ecoroute/backend/internal/utils"
)

func Seed(ctx context.Context, pool *pgxpool.Pool) error {
	if err := seedUser(ctx, pool, "admin@ecoroute.dev", "admin123", models.RoleAdmin, "Admin"); err != nil {
		return err
	}
	if err := seedUser(ctx, pool, "driver@ecoroute.dev", "driver123", models.RoleDriver, "Driver"); err != nil {
		return err
	}
	if err := seedUser(ctx, pool, "community@ecoroute.dev", "community123", models.RoleCommunity, "Resident"); err != nil {
		return err
	}
	log.Println("seed: users ok")

	points := []struct {
		name  string
		lat   float64
		lng   float64
		level int
	}{
		{"Kondele", -0.0900, 34.8000, 92},
		{"Market A", -0.0950, 34.7300, 76},
		{"Manyatta", -0.0950, 34.7900, 43},
		{"Nyalenda", -0.1100, 34.7200, 88},
	}
	pointIDs := map[string]string{}
	for _, p := range points {
		id, err := seedWastePoint(ctx, pool, p.name, p.lat, p.lng, p.level)
		if err != nil {
			return err
		}
		pointIDs[p.name] = id
	}
	log.Println("seed: waste points ok")

	driverID, err := userIDByEmail(ctx, pool, "driver@ecoroute.dev")
	if err != nil {
		return err
	}
	if _, err := seedTruck(ctx, pool, "KCA 123A", 5000, driverID, -0.1022, 34.7617); err != nil {
		return err
	}
	log.Println("seed: truck ok")

	communityID, err := userIDByEmail(ctx, pool, "community@ecoroute.dev")
	if err != nil {
		return err
	}
	reports := []struct {
		pointID     string
		problemType string
		description string
	}{
		{pointIDs["Kondele"], models.ProblemOverflow, "Kondele bin overflowing, not collected for 3 days"},
		{pointIDs["Market A"], models.ProblemMissedCollection, "Missed collection all week"},
	}
	for _, r := range reports {
		if err := seedReport(ctx, pool, communityID, r.pointID, r.problemType, r.description); err != nil {
			return err
		}
	}
	log.Println("seed: reports ok")

	return nil
}

func seedUser(ctx context.Context, pool *pgxpool.Pool, email, password string, role models.Role, name string) error {
	var exists bool
	if err := pool.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)`, email).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}

	hash, err := utils.HashPassword(password)
	if err != nil {
		return err
	}
	_, err = pool.Exec(ctx,
		`INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
		name, email, hash, role)
	return err
}

func seedWastePoint(ctx context.Context, pool *pgxpool.Pool, name string, lat, lng float64, level int) (string, error) {
	var id string
	err := pool.QueryRow(ctx, `SELECT id FROM waste_points WHERE name = $1`, name).Scan(&id)
	if err == nil {
		return id, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	err = pool.QueryRow(ctx,
		`INSERT INTO waste_points (name, latitude, longitude, current_level_pct, status)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		name, lat, lng, level, services.StatusForLevel(level)).Scan(&id)
	return id, err
}

func seedTruck(ctx context.Context, pool *pgxpool.Pool, reg string, capacity float64, driverID string, lat, lng float64) (string, error) {
	var id string
	err := pool.QueryRow(ctx, `SELECT id FROM trucks WHERE registration_number = $1`, reg).Scan(&id)
	if err == nil {
		_, err := pool.Exec(ctx,
			`UPDATE trucks SET capacity_kg = $2, driver_id = $3, current_lat = $4, current_lng = $5 WHERE id = $1`,
			id, capacity, driverID, lat, lng)
		return id, err
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	err = pool.QueryRow(ctx,
		`INSERT INTO trucks (registration_number, capacity_kg, driver_id, current_lat, current_lng, status)
		 VALUES ($1, $2, $3, $4, $5, 'idle') RETURNING id`,
		reg, capacity, driverID, lat, lng).Scan(&id)
	return id, err
}

func seedReport(ctx context.Context, pool *pgxpool.Pool, reporterID, pointID, problemType, description string) error {
	var exists bool
	if err := pool.QueryRow(ctx,
		`SELECT EXISTS (
			SELECT 1 FROM waste_reports
			WHERE reported_by = $1 AND waste_point_id = $2 AND problem_type = $3
		 )`, reporterID, pointID, problemType).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}

	priority := models.ReportPriorityMedium
	if problemType == models.ProblemOverflow || problemType == models.ProblemMissedCollection {
		priority = models.ReportPriorityHigh
	}

	_, err := pool.Exec(ctx,
		`INSERT INTO waste_reports (waste_point_id, reported_by, problem_type, description, priority, status)
		 VALUES ($1, $2, $3, $4, $5, 'open')`,
		pointID, reporterID, problemType, description, priority)
	return err
}

func userIDByEmail(ctx context.Context, pool *pgxpool.Pool, email string) (string, error) {
	var id string
	err := pool.QueryRow(ctx, `SELECT id FROM users WHERE email = $1`, email).Scan(&id)
	return id, err
}
