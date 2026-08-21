package models

import "time"

const (
	RecyclerStatusActive   = "active"
	RecyclerStatusInactive = "inactive"
)

type Guide struct {
	Benefits []string `json:"benefits"`
	Process  []string `json:"process"`
	Products []string `json:"products"`
}

type WasteType struct {
	Slug           string   `json:"slug"`
	Name           string   `json:"name"`
	Recyclable     bool     `json:"recyclable"`
	CO2PerKg       float64  `json:"co2_per_kg"`
	EnergyKwhPerKg float64  `json:"energy_kwh_per_kg"`
	Preparation    []string `json:"preparation"`
	Guide          Guide    `json:"guide"`
	SortOrder      int      `json:"sort_order"`
}

type Recycler struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Address       string    `json:"address"`
	Phone         string    `json:"phone"`
	Website       string    `json:"website"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	AcceptedTypes []string  `json:"accepted_types"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	DistanceKm    *float64  `json:"distance_km,omitempty"`
	AcceptsType   *bool     `json:"accepts_type,omitempty"`
}

type RecyclerInput struct {
	Name          string   `json:"name"`
	Address       string   `json:"address"`
	Phone         string   `json:"phone"`
	Website       string   `json:"website"`
	Latitude      float64  `json:"latitude"`
	Longitude     float64  `json:"longitude"`
	AcceptedTypes []string `json:"accepted_types"`
	Status        string   `json:"status"`
}

type RecyclingRecord struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	WasteType    string    `json:"waste_type"`
	WasteName    string    `json:"waste_name"`
	EstimatedKg  float64   `json:"estimated_kg"`
	RecyclerID   *string   `json:"recycler_id"`
	RecyclerName *string   `json:"recycler_name"`
	PhotoURL     *string   `json:"photo_url"`
	CreatedAt    time.Time `json:"created_at"`
}

type RecycleInput struct {
	WasteType   string  `json:"waste_type"`
	EstimatedKg float64 `json:"estimated_kg"`
	RecyclerID  *string `json:"recycler_id"`
	PhotoURL    *string `json:"photo_url"`
}

type TypeImpact struct {
	Slug           string  `json:"slug"`
	Name           string  `json:"name"`
	Count          int     `json:"count"`
	Kg             float64 `json:"kg"`
	CO2SavedKg     float64 `json:"co2_saved_kg"`
	EnergySavedKwh float64 `json:"energy_saved_kwh"`
}

type RecyclingImpact struct {
	TotalKg            float64               `json:"total_kg"`
	ItemsRecycled      int                   `json:"items_recycled"`
	CO2SavedKg         float64               `json:"co2_saved_kg"`
	EnergySavedKwh     float64               `json:"energy_saved_kwh"`
	LandfillDivertedKg float64               `json:"landfill_diverted_kg"`
	ByType             []TypeImpact          `json:"by_type"`
}
