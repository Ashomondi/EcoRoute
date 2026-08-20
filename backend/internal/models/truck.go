package models

import "time"

const (
	TruckStatusIdle        = "idle"
	TruckStatusEnRoute     = "en_route"
	TruckStatusFull        = "full"
	TruckStatusMaintenance = "maintenance"
)

type Truck struct {
	ID                 string    `json:"id"`
	RegistrationNumber string    `json:"registration_number"`
	CapacityKg         float64   `json:"capacity_kg"`
	DriverID           *string   `json:"driver_id"`
	CurrentLat         float64   `json:"current_lat"`
	CurrentLng         float64   `json:"current_lng"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"created_at"`
}

type TruckInput struct {
	RegistrationNumber string  `json:"registration_number"`
	CapacityKg         float64 `json:"capacity_kg"`
	DriverID           *string `json:"driver_id"`
	CurrentLat         float64 `json:"current_lat"`
	CurrentLng         float64 `json:"current_lng"`
	Status             string  `json:"status"`
}
