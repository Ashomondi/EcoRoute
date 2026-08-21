package models

import "time"

type AnalyticsSummary struct {
	CollectedToday     int     `json:"collected_today"`
	CollectedTodayKg   float64 `json:"collected_today_kg"`
	RecycledKg         float64 `json:"recycled_kg"`
	LandfillDivertedKg float64 `json:"landfill_diverted_kg"`
	CollectionRatePct  float64 `json:"collection_rate_pct"`

	TotalRoutes     int     `json:"total_routes"`
	TotalDistanceKm float64 `json:"total_distance_km"`
	DistanceSavedKm float64 `json:"distance_saved_km"`
	FuelSavedL      float64 `json:"fuel_saved_l"`
	CO2AvoidedKg    float64 `json:"co2_avoided_kg"`

	RecycledMaterialValue float64 `json:"recycled_material_value"`
}

type DailySummary struct {
	Day            time.Time `json:"day"`
	CollectedCount int       `json:"collected_count"`
	FailedCount    int       `json:"failed_count"`
	CollectedKg    float64   `json:"collected_kg"`
}
