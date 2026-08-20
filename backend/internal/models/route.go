package models

import "time"

const (
	RouteStatusPlanned   = "planned"
	RouteStatusActive    = "active"
	RouteStatusCompleted = "completed"
)

type Route struct {
	ID               string    `json:"id"`
	TruckID          string    `json:"truck_id"`
	OrderedPointIDs  []string  `json:"ordered_point_ids"`
	DistanceKm       float64   `json:"distance_km"`
	EstimatedFuelL   float64   `json:"estimated_fuel_l"`
	EstimatedMinutes int       `json:"estimated_minutes"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
}

type RouteStop struct {
	Order      int        `json:"order"`
	WastePoint WastePoint `json:"waste_point"`
}

type OptimizationResult struct {
	RouteID          string      `json:"route_id"`
	TruckID          string      `json:"truck_id"`
	Stops            []RouteStop `json:"stops"`
	DistanceKm       float64     `json:"distance_km"`
	EstimatedMinutes int         `json:"estimated_minutes"`
	EstimatedFuelL   float64     `json:"estimated_fuel_l"`

	BaselineDistanceKm float64 `json:"baseline_distance_km"`
	BaselineMinutes    int     `json:"baseline_minutes"`
	BaselineFuelL      float64 `json:"baseline_fuel_l"`
	DistanceSavedKm    float64 `json:"distance_saved_km"`
	FuelSavedL         float64 `json:"fuel_saved_l"`
	TimeSavedMinutes   int     `json:"time_saved_minutes"`
}
