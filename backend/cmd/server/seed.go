package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"math"
	"time"

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
	truckLat, truckLng := -0.1022, 34.7617
	truckID, err := seedTruck(ctx, pool, "KCA 123A", 5000, driverID, truckLat, truckLng)
	if err != nil {
		return err
	}
	log.Println("seed: truck ok")

	// Seed a scheduled (planned) route so residents can see upcoming collections.
	if _, err := seedRoute(ctx, pool, truckID, models.RouteStatusPlanned,
		[]seedRouteStop{
			{id: pointIDs["Kondele"], lat: -0.0900, lng: 34.8000},
			{id: pointIDs["Manyatta"], lat: -0.0950, lng: 34.7900},
			{id: pointIDs["Market A"], lat: -0.0950, lng: 34.7300},
			{id: pointIDs["Nyalenda"], lat: -0.1100, lng: 34.7200},
		}, truckLat, truckLng); err != nil {
		return err
	}
	log.Println("seed: scheduled route ok")

	// Seed a completed route with past collection records for history.
	completedRouteID, err := seedRoute(ctx, pool, truckID, models.RouteStatusCompleted,
		[]seedRouteStop{
			{id: pointIDs["Kondele"], lat: -0.0900, lng: 34.8000},
			{id: pointIDs["Market A"], lat: -0.0950, lng: 34.7300},
		}, truckLat, truckLng)
	if err != nil {
		return err
	}
	for _, c := range []struct {
		pointID string
		outcome string
		kg      float64
		daysAgo int
	}{
		{pointIDs["Kondele"], models.OutcomeCollected, 920, 1},
		{pointIDs["Market A"], models.OutcomeCollected, 760, 2},
		{pointIDs["Nyalenda"], models.OutcomeFailed, 880, 3},
	} {
		if err := seedCollection(ctx, pool, completedRouteID, truckID, c.pointID, c.outcome, c.kg, c.daysAgo); err != nil {
			return err
		}
	}
	log.Println("seed: collection history ok")

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

	if err := seedRecycling(ctx, pool, communityID); err != nil {
		return err
	}
	log.Println("seed: recycling ok")

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

func seedRecycling(ctx context.Context, pool *pgxpool.Pool, communityID string) error {
	recyclers := []struct {
		name   string
		addr   string
		lat    float64
		lng    float64
		types  []string
	}{
		{"Lake Basin Recycling Centre", "Oginga Odinga St, Kisumu", -0.1040, 34.7440, []string{"plastic", "paper", "metal", "glass"}},
		{"Kisumu Green Compost Hub", "Milimani, Kisumu", -0.1000, 34.7630, []string{"organic", "paper"}},
		{"Uzima E-Waste Drop", "Jomo Kenyatta Ave, Kisumu", -0.1100, 34.7560, []string{"e_waste"}},
		{"Manyatta Textile Redemption", "Manyatta B, Kisumu", -0.0950, 34.7900, []string{"textile"}},
		{"Nyalenda Battery & Chemical Drop", "Nyalenda, Kisumu", -0.1100, 34.7200, []string{"hazardous"}},
	}
	ids := map[string]string{}
	for _, rc := range recyclers {
		id, err := seedRecycler(ctx, pool, rc.name, rc.addr, rc.lat, rc.lng, rc.types)
		if err != nil {
			return err
		}
		ids[rc.name] = id
	}

	records := []struct {
		kind   string
		kg     float64
		name   string
	}{
		{"paper", 3.0, "Lake Basin Recycling Centre"},
		{"plastic", 2.0, "Lake Basin Recycling Centre"},
	}
	for _, rec := range records {
		var recyclerID *string
		if id, ok := ids[rec.name]; ok {
			recyclerID = &id
		}
		if err := seedRecyclingRecord(ctx, pool, communityID, rec.kind, rec.kg, recyclerID); err != nil {
			return err
		}
	}
	return nil
}

func seedRecycler(ctx context.Context, pool *pgxpool.Pool, name, addr string, lat, lng float64, accepted []string) (string, error) {
	var id string
	err := pool.QueryRow(ctx, `SELECT id FROM recyclers WHERE name = $1`, name).Scan(&id)
	if err == nil {
		return id, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}
	err = pool.QueryRow(ctx,
		`INSERT INTO recyclers (name, address, latitude, longitude, accepted_types)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		name, addr, lat, lng, accepted).Scan(&id)
	return id, err
}

func seedRecyclingRecord(ctx context.Context, pool *pgxpool.Pool, userID, wasteType string, kg float64, recyclerID *string) error {
	var exists bool
	if err := pool.QueryRow(ctx,
		`SELECT EXISTS (
			SELECT 1 FROM recycling_records
			WHERE user_id = $1 AND waste_type = $2 AND estimated_kg = $3
		 )`, userID, wasteType, kg).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	_, err := pool.Exec(ctx,
		`INSERT INTO recycling_records (user_id, waste_type, estimated_kg, recycler_id)
		 VALUES ($1, $2, $3, $4)`,
		userID, wasteType, kg, recyclerID)
	return err
}

func userIDByEmail(ctx context.Context, pool *pgxpool.Pool, email string) (string, error) {
	var id string
	err := pool.QueryRow(ctx, `SELECT id FROM users WHERE email = $1`, email).Scan(&id)
	return id, err
}

type seedRouteStop struct {
	id  string
	lat float64
	lng float64
}

func seedRoute(ctx context.Context, pool *pgxpool.Pool, truckID, status string, stops []seedRouteStop, startLat, startLng float64) (string, error) {
	var existing string
	err := pool.QueryRow(ctx,
		`SELECT id FROM routes WHERE truck_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1`,
		truckID, status).Scan(&existing)
	if err == nil {
		return existing, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	ids := make([]string, len(stops))
	distance := 0.0
	prevLat, prevLng := startLat, startLng
	for i, s := range stops {
		ids[i] = s.id
		distance += utils.HaversineKm(prevLat, prevLng, s.lat, s.lng)
		prevLat, prevLng = s.lat, s.lng
	}
	minutes := int(math.Round(distance/25.0*60 + 10.0*float64(len(stops))))
	fuel := distance*0.2 + 0.1*float64(len(stops))
	pointsJSON, err := json.Marshal(ids)
	if err != nil {
		return "", err
	}

	var id string
	err = pool.QueryRow(ctx,
		`INSERT INTO routes (truck_id, ordered_point_ids, distance_km, baseline_distance_km, estimated_fuel_l, estimated_minutes, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		truckID, string(pointsJSON), distance, distance, fuel, minutes, status).Scan(&id)
	return id, err
}

func seedCollection(ctx context.Context, pool *pgxpool.Pool, routeID, truckID, pointID, outcome string, kg float64, daysAgo int) error {
	var exists bool
	err := pool.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM collection_records WHERE route_id = $1 AND waste_point_id = $2 AND outcome = $3)`,
		routeID, pointID, outcome).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}

	collectedAt := time.Now().AddDate(0, 0, -daysAgo)
	_, err = pool.Exec(ctx,
		`INSERT INTO collection_records (route_id, waste_point_id, truck_id, outcome, estimated_kg, collected_at)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		routeID, pointID, truckID, outcome, kg, collectedAt)
	return err
}
