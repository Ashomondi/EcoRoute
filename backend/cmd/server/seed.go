package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"math"
	"strings"
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
		name     string
		lat      float64
		lng      float64
		level    int
		category string
		capacity float64
	}{
		{"Kondele", -0.0900, 34.8000, 92, "organic", 200},
		{"Market A", -0.0950, 34.7300, 76, "paper", 250},
		{"Manyatta", -0.0950, 34.7900, 43, "glass", 180},
		{"Nyalenda", -0.1100, 34.7200, 88, "plastic", 220},
	}
	pointIDs := map[string]string{}
	for _, p := range points {
		id, err := seedWastePoint(ctx, pool, p.name, p.lat, p.lng, p.level, p.category, p.capacity)
		if err != nil {
			return err
		}
		pointIDs[p.name] = id
	}
	log.Println("seed: waste points ok")

	if err := seedSmartBinReadings(ctx, pool, pointIDs); err != nil {
		return err
	}
	log.Println("seed: smart bin readings ok")

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

	if err := seedCollectionRequests(ctx, pool, communityID); err != nil {
		return err
	}
	log.Println("seed: collection requests ok")

	var collectionID, dropoffID string
	if err := pool.QueryRow(ctx,
		`SELECT id FROM collection_records WHERE outcome = 'collected' ORDER BY collected_at DESC LIMIT 1`).Scan(&collectionID); err != nil {
		return err
	}
	if err := pool.QueryRow(ctx,
		`SELECT id FROM recycling_records ORDER BY created_at DESC LIMIT 1`).Scan(&dropoffID); err != nil {
		return err
	}
	if err := seedMaterialProcessing(ctx, pool, collectionID, dropoffID); err != nil {
		return err
	}
	log.Println("seed: recycling centre ok")

	if err := seedMarketplace(ctx, pool, communityID); err != nil {
		return err
	}
	log.Println("seed: marketplace ok")

	return nil
}

func seedSmartBinReadings(ctx context.Context, pool *pgxpool.Pool, pointIDs map[string]string) error {
	fullBinID := pointIDs["Nyalenda"]
	composition := map[string]float64{"plastic": 18.2, "organic": 3.4, "paper": 2.1}
	totalKg := 23.7

	var exists bool
	if err := pool.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM smart_bin_readings WHERE waste_point_id = $1)`, fullBinID).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	compJSON, err := json.Marshal(composition)
	if err != nil {
		return err
	}
	if _, err := pool.Exec(ctx,
		`UPDATE waste_points SET current_estimated_kg = $2 WHERE id = $1`, fullBinID, totalKg); err != nil {
		return err
	}
	_, err = pool.Exec(ctx,
		`INSERT INTO smart_bin_readings (waste_point_id, total_kg, composition, primary_category, confidence, trigger_type, status)
		 VALUES ($1, $2, $3, 'plastic', 0.93, 'full', 'pending')`,
		fullBinID, totalKg, compJSON)
	return err
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

func seedWastePoint(ctx context.Context, pool *pgxpool.Pool, name string, lat, lng float64, level int, category string, capacity float64) (string, error) {
	var id string
	err := pool.QueryRow(ctx, `SELECT id FROM waste_points WHERE name = $1`, name).Scan(&id)
	if err == nil {
		_, err := pool.Exec(ctx,
			`UPDATE waste_points SET latitude = $2, longitude = $3, current_level_pct = $4, status = $5,
			        category = $6, max_capacity_kg = $7 WHERE id = $1`,
			id, lat, lng, level, services.StatusForLevel(level), category, capacity)
		return id, err
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	err = pool.QueryRow(ctx,
		`INSERT INTO waste_points (name, latitude, longitude, current_level_pct, status, category, max_capacity_kg)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		name, lat, lng, level, services.StatusForLevel(level), category, capacity).Scan(&id)
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

func seedCollectionRequests(ctx context.Context, pool *pgxpool.Pool, communityID string) error {
	requests := []struct {
		typ   string
		waste string
		kg    float64
		lat   float64
		lng   float64
		addr  string
		notes string
	}{
		{models.RequestTypeHousehold, "plastic", 8, -0.0980, 34.7750, "Kondele Phase 2", "Mixed bottles and containers"},
		{models.RequestTypeBusiness, "paper", 35, -0.1030, 34.7600, "Oginga Odinga St", "Office paper waste from a small shop"},
		{models.RequestTypeHousehold, "e_waste", 4, -0.1110, 34.7500, "Nyalenda", "Old phones and a laptop"},
	}
	for _, req := range requests {
		var exists bool
		if err := pool.QueryRow(ctx,
			`SELECT EXISTS (SELECT 1 FROM collection_requests WHERE requester_id = $1 AND waste_type = $2 AND estimated_kg = $3)`,
			communityID, req.waste, req.kg).Scan(&exists); err != nil {
			return err
		}
		if exists {
			continue
		}
		notes := req.notes
		if _, err := pool.Exec(ctx,
			`INSERT INTO collection_requests
			   (requester_id, requester_type, waste_type, estimated_kg, latitude, longitude, address, notes, status)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`,
			communityID, req.typ, req.waste, req.kg, req.lat, req.lng, req.addr, notes); err != nil {
			return err
		}
	}
	return nil
}

func seedMaterialProcessing(ctx context.Context, pool *pgxpool.Pool, collectionID, dropoffID string) error {
	batches := []struct {
		sourceType string
		sourceID   string
		material   string
		kg         float64
		status     string
	}{
		{models.MaterialSourceCollection, collectionID, "plastic", 6, models.MaterialStatusRecycled},
		{models.MaterialSourceCollection, collectionID, "metal", 4, models.MaterialStatusSorted},
		{models.MaterialSourceDropoff, dropoffID, "paper", 3, models.MaterialStatusSold},
		{models.MaterialSourceDropoff, dropoffID, "organic", 10, models.MaterialStatusRecycled},
	}
	for _, b := range batches {
		var exists bool
		if err := pool.QueryRow(ctx,
			`SELECT EXISTS (SELECT 1 FROM material_processing WHERE source_type = $1 AND source_id = $2 AND material = $3)`,
			b.sourceType, b.sourceID, b.material).Scan(&exists); err != nil {
			return err
		}
		if exists {
			continue
		}
		sortedKg := 0.0
		recycledKg := 0.0
		switch b.status {
		case models.MaterialStatusSorted:
			sortedKg = b.kg
		case models.MaterialStatusRecycled, models.MaterialStatusSold:
			sortedKg = b.kg
			recycledKg = b.kg
		}
		if _, err := pool.Exec(ctx,
			`INSERT INTO material_processing (source_type, source_id, material, received_kg, sorted_kg, recycled_kg, status)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			b.sourceType, b.sourceID, b.material, b.kg, sortedKg, recycledKg, b.status); err != nil {
			return err
		}
	}
	return nil
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

func seedMarketplace(ctx context.Context, pool *pgxpool.Pool, communityID string) error {
	if err := seedUser(ctx, pool, "seller@ecoroute.dev", "seller123", models.RoleCommunity, "GreenHome Kenya"); err != nil {
		return err
	}
	sellerUserID, err := userIDByEmail(ctx, pool, "seller@ecoroute.dev")
	if err != nil {
		return err
	}

	sellerID, err := seedSellerProfile(ctx, pool, sellerUserID)
	if err != nil {
		return err
	}

	plasticBatchID, err := materialBatchID(ctx, pool, "collection", "plastic")
	if err != nil {
		return err
	}
	paperBatchID, err := materialBatchID(ctx, pool, "dropoff", "paper")
	if err != nil {
		return err
	}
	organicBatchID, err := materialBatchID(ctx, pool, "dropoff", "organic")
	if err != nil {
		return err
	}

	products := []struct {
		name             string
		category         string
		price            float64
		stock            int
		batchID          string
		recycledPercent  int
		wasteRecoveredKg float64
	}{
		{"EcoChair — Recycled Plastic", "plastic", 3500, 24, plasticBatchID, 85, 8.2},
		{"EcoGrip Storage Crate", "plastic", 1200, 40, plasticBatchID, 90, 3.4},
		{"Recycled Paper Notebook", "paper", 450, 60, paperBatchID, 100, 0.5},
		{"EcoRoute Organic Compost 10kg", "organic", 500, 35, organicBatchID, 100, 10},
	}
	productIDs := map[string]string{}
	for _, p := range products {
		id, err := seedProduct(ctx, pool, sellerID, p.name, p.category, p.price, p.stock, p.batchID, p.recycledPercent, p.wasteRecoveredKg)
		if err != nil {
			return err
		}
		productIDs[p.name] = id
	}

	reviews := []struct {
		productID string
		rating    int
		comment   string
	}{
		{productIDs["EcoChair — Recycled Plastic"], 5, "Solid chair, great to know it came from collected bottles."},
		{productIDs["Recycled Paper Notebook"], 4, "Nice notebooks and clearly recycled paper."},
		{productIDs["EcoRoute Organic Compost 10kg"], 5, "My garden loves this compost."},
	}
	for _, rv := range reviews {
		if err := seedReview(ctx, pool, rv.productID, communityID, rv.rating, rv.comment); err != nil {
			return err
		}
	}

	orders := []struct {
		orderNumber string
		status      string
		items       []struct {
			productID string
			qty       int
		}
		deliveryAddress string
		daysAgo         int
	}{
		{
			orderNumber:     "ECO-SEED-0001",
			status:          models.OrderStatusDelivered,
			deliveryAddress: "Kondele Phase 2, Kisumu",
			daysAgo:         3,
			items: []struct {
				productID string
				qty       int
			}{
				{productIDs["EcoChair — Recycled Plastic"], 1},
				{productIDs["Recycled Paper Notebook"], 2},
			},
		},
		{
			orderNumber:     "ECO-SEED-0002",
			status:          models.OrderStatusPaid,
			deliveryAddress: "Milimani, Kisumu",
			daysAgo:         1,
			items: []struct {
				productID string
				qty       int
			}{
				{productIDs["EcoRoute Organic Compost 10kg"], 2},
			},
		},
	}
	for _, o := range orders {
		if err := seedOrder(ctx, pool, communityID, sellerID, o.orderNumber, o.status, o.deliveryAddress, o.daysAgo, o.items); err != nil {
			return err
		}
	}
	return nil
}

func seedSellerProfile(ctx context.Context, pool *pgxpool.Pool, userID string) (string, error) {
	var id string
	err := pool.QueryRow(ctx, `SELECT id FROM seller_profiles WHERE user_id = $1`, userID).Scan(&id)
	if err == nil {
		return id, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}
	err = pool.QueryRow(ctx,
		`INSERT INTO seller_profiles (user_id, name, description, contact_phone, location, verified)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		userID, "GreenHome Kenya", "We turn recovered EcoRoute materials into furniture and home goods for the Kisumu community.", "0700 123 456", "Kisumu, Kenya", true).Scan(&id)
	return id, err
}

func materialBatchID(ctx context.Context, pool *pgxpool.Pool, sourceType, material string) (string, error) {
	var id string
	err := pool.QueryRow(ctx,
		`SELECT id FROM material_processing WHERE source_type = $1 AND material = $2 ORDER BY created_at DESC LIMIT 1`,
		sourceType, material).Scan(&id)
	return id, err
}

func seedProduct(ctx context.Context, pool *pgxpool.Pool, sellerID, name, category string, price float64, stock int, batchID string, recycledPercent int, wasteRecoveredKg float64) (string, error) {
	slug := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), " ", "-"))
	var id string
	err := pool.QueryRow(ctx, `SELECT id FROM products WHERE slug = $1`, slug).Scan(&id)
	if err == nil {
		return id, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}
	err = pool.QueryRow(ctx,
		`INSERT INTO products
		   (seller_id, name, slug, description, category, price, stock, material_batch_id, recycled_percent, waste_recovered_kg, unit, is_active)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'unit', TRUE)
		 RETURNING id`,
		sellerID, name, slug, "Crafted by GreenHome Kenya from material recovered through the EcoRoute recycling pipeline.", category, price, stock, batchID, recycledPercent, wasteRecoveredKg).Scan(&id)
	return id, err
}

func seedReview(ctx context.Context, pool *pgxpool.Pool, productID, userID string, rating int, comment string) error {
	var exists bool
	if err := pool.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM product_reviews WHERE product_id = $1 AND user_id = $2)`,
		productID, userID).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	_, err := pool.Exec(ctx,
		`INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)`,
		productID, userID, rating, comment)
	return err
}

func seedOrder(ctx context.Context, pool *pgxpool.Pool, userID, sellerID, orderNumber, status, address string, daysAgo int, items []struct {
	productID string
	qty       int
}) error {
	var exists bool
	if err := pool.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM orders WHERE order_number = $1)`, orderNumber).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var subtotal float64
	type item struct {
		productID string
		name      string
		price     float64
		wasteKg   float64
		qty       int
	}
	rows := []item{}
	for _, it := range items {
		var name string
		var price, wasteKg float64
		if err := tx.QueryRow(ctx,
			`SELECT name, price::float8, waste_recovered_kg::float8 FROM products WHERE id = $1`,
			it.productID).Scan(&name, &price, &wasteKg); err != nil {
			return err
		}
		rows = append(rows, item{it.productID, name, price, wasteKg, it.qty})
		subtotal += price * float64(it.qty)
	}
	total := subtotal + 150.0

	var orderID string
	if err := tx.QueryRow(ctx,
		`INSERT INTO orders (user_id, order_number, status, subtotal, delivery_fee, total, payment_method, delivery_address, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, 'mpesa', $7, $8, $8)
		 RETURNING id`,
		userID, orderNumber, status, subtotal, 150.0, total, address, time.Now().AddDate(0, 0, -daysAgo)).Scan(&orderID); err != nil {
		return err
	}

	for _, it := range rows {
		line := it.price * float64(it.qty)
		fee := line * models.EcoRouteCommission
		if _, err := tx.Exec(ctx,
			`INSERT INTO order_items
			   (order_id, product_id, seller_id, product_name, unit_price, quantity, line_total, ecoroute_fee, seller_share, waste_recovered_kg)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			orderID, it.productID, sellerID, it.name, it.price, it.qty, line, fee, line-fee, it.wasteKg*float64(it.qty)); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx,
			`UPDATE products SET stock = stock - $2, updated_at = now() WHERE id = $1`, it.productID, it.qty); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO payments (order_id, amount, method, status, reference)
		 VALUES ($1, $2, 'mpesa', 'paid', $3)`,
		orderID, total, "PAY-SEED-"+orderNumber); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
