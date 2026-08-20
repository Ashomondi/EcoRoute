package services

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
)

const co2KgPerLitreFuel = 2.68

type AnalyticsService struct {
	pool *pgxpool.Pool
}

func NewAnalyticsService(pool *pgxpool.Pool) *AnalyticsService {
	return &AnalyticsService{pool: pool}
}

func (s *AnalyticsService) Summary(ctx context.Context) (*models.AnalyticsSummary, error) {
	summary := &models.AnalyticsSummary{}

	if err := s.pool.QueryRow(ctx,
		`SELECT count(*), coalesce(sum(estimated_kg), 0)
		 FROM collection_records
		 WHERE outcome = 'collected' AND date_trunc('day', collected_at) = current_date`,
	).Scan(&summary.CollectedToday, &summary.CollectedTodayKg); err != nil {
		return nil, err
	}

	var collectedCount, totalCount int
	if err := s.pool.QueryRow(ctx,
		`SELECT count(*) FILTER (WHERE outcome = 'collected'), count(*)
		 FROM collection_records`,
	).Scan(&collectedCount, &totalCount); err != nil {
		return nil, err
	}
	if totalCount > 0 {
		summary.CollectionRatePct = float64(collectedCount) / float64(totalCount) * 100
	}

	if err := s.pool.QueryRow(ctx,
		`SELECT count(*), coalesce(sum(distance_km), 0), coalesce(sum(baseline_distance_km - distance_km), 0)
		 FROM routes`,
	).Scan(&summary.TotalRoutes, &summary.TotalDistanceKm, &summary.DistanceSavedKm); err != nil {
		return nil, err
	}

	summary.RecycledKg = summary.CollectedTodayKg
	summary.LandfillDivertedKg = summary.CollectedTodayKg
	summary.FuelSavedL = summary.DistanceSavedKm * fuelLPerKm
	summary.CO2AvoidedKg = summary.FuelSavedL * co2KgPerLitreFuel

	return summary, nil
}
