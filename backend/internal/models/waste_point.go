package models

import "time"

const (
	StatusOK       = "ok"
	StatusWarning  = "warning"
	StatusCritical = "critical"
)

type WastePoint struct {
	ID                 string        `json:"id"`
	Name               string        `json:"name"`
	Latitude           float64       `json:"latitude"`
	Longitude          float64       `json:"longitude"`
	CurrentLevelPct    int           `json:"current_level_pct"`
	Status             string        `json:"status"`
	LastCollectedAt    *time.Time    `json:"last_collected_at"`
	CreatedAt          time.Time     `json:"created_at"`
	Category           string        `json:"category"`
	CategoryName       string        `json:"category_name,omitempty"`
	MaxCapacityKg      float64       `json:"max_capacity_kg"`
	CurrentEstimatedKg float64       `json:"current_estimated_kg"`
	Prediction         *AIPrediction `json:"prediction,omitempty"`
}

type AIPrediction struct {
	PredictedLevelTomorrow int  `json:"predicted_level_tomorrow"`
	RecommendCollect       bool `json:"recommend_collect"`
}

type WastePointInput struct {
	Name            string  `json:"name"`
	Latitude        float64 `json:"latitude"`
	Longitude       float64 `json:"longitude"`
	CurrentLevelPct *int    `json:"current_level_pct"`
	Category        string  `json:"category"`
	MaxCapacityKg   float64 `json:"max_capacity_kg"`
}
