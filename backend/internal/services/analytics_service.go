package services

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
)

const co2KgPerLitreFuel = 2.68

type AnalyticsService struct {
	pool      *pgxpool.Pool
	recycling *repositories.RecyclingRepository
	processing *repositories.MaterialProcessingRepository
}

func NewAnalyticsService(pool *pgxpool.Pool) *AnalyticsService {
	return &AnalyticsService{
		pool:       pool,
		recycling:  repositories.NewRecyclingRepository(pool),
		processing: repositories.NewMaterialProcessingRepository(pool),
	}
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

	recycledKg, recyclingCO2, err := s.recycling.RecyclingTotals(ctx)
	if err != nil {
		return nil, err
	}

	summary.RecycledKg = recycledKg
	summary.LandfillDivertedKg = recycledKg
	summary.FuelSavedL = summary.DistanceSavedKm * fuelLPerKm
	summary.CO2AvoidedKg = summary.FuelSavedL*co2KgPerLitreFuel + recyclingCO2

	summary.RecycledMaterialValue, err = s.processing.MaterialValue(ctx)
	if err != nil {
		return nil, err
	}

	return summary, nil
}

func (s *AnalyticsService) Trend(ctx context.Context, days int) ([]models.DailySummary, error) {
	if days <= 0 || days > 90 {
		days = 7
	}

	rows, err := s.pool.Query(ctx,
		`SELECT day, collected_count, failed_count, collected_kg
		 FROM daily_collection_summary
		 WHERE day >= current_date - make_interval(days => $1)
		 ORDER BY day`, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	trend := []models.DailySummary{}
	for rows.Next() {
		d := models.DailySummary{}
		if err := rows.Scan(&d.Day, &d.CollectedCount, &d.FailedCount, &d.CollectedKg); err != nil {
			return nil, err
		}
		trend = append(trend, d)
	}
	return trend, rows.Err()
}
