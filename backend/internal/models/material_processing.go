package models

import "time"

const (
	MaterialSourceCollection = "collection"
	MaterialSourceDropoff    = "dropoff"

	MaterialStatusReceived   = "received"
	MaterialStatusSorted     = "sorted"
	MaterialStatusProcessing = "processing"
	MaterialStatusRecycled   = "recycled"
	MaterialStatusSold       = "sold"
)

type MaterialBatch struct {
	ID           string    `json:"id"`
	SourceType   string    `json:"source_type"`
	SourceID     string    `json:"source_id"`
	Material     string    `json:"material"`
	MaterialName string    `json:"material_name"`
	ReceivedKg   float64   `json:"received_kg"`
	SortedKg     float64   `json:"sorted_kg"`
	RecycledKg   float64   `json:"recycled_kg"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type MaterialBatchInput struct {
	SourceType string  `json:"source_type"`
	SourceID   string  `json:"source_id"`
	Material   string  `json:"material"`
	ReceivedKg float64 `json:"received_kg"`
}

type MaterialStatusInput struct {
	Status string `json:"status"`
}

type MaterialValueRow struct {
	Material       string  `json:"material"`
	MaterialName   string  `json:"material_name"`
	Batches        int     `json:"batches"`
	ReceivedKg     float64 `json:"received_kg"`
	SortedKg       float64 `json:"sorted_kg"`
	RecycledKg     float64 `json:"recycled_kg"`
	MaterialValue  float64 `json:"material_value"`
	CO2SavedKg     float64 `json:"co2_saved_kg"`
	EnergySavedKwh float64 `json:"energy_saved_kwh"`
}

type RecyclingCenterSummary struct {
	TotalReceivedKg      float64           `json:"total_received_kg"`
	TotalSortedKg        float64           `json:"total_sorted_kg"`
	TotalRecycledKg      float64           `json:"total_recycled_kg"`
	TotalMaterialValue   float64           `json:"total_material_value"`
	TotalCO2SavedKg      float64           `json:"total_co2_saved_kg"`
	TotalEnergySavedKwh  float64           `json:"total_energy_saved_kwh"`
	ByMaterial           []MaterialValueRow `json:"by_material"`
}
