package models

import "time"

const (
	RequestTypeHousehold = "household"
	RequestTypeBusiness  = "business"

	RequestStatusPending   = "pending"
	RequestStatusScheduled = "scheduled"
	RequestStatusCollected = "collected"
	RequestStatusCancelled = "cancelled"
)

type ScoreBreakdown struct {
	Urgency   float64 `json:"urgency"`
	Demand    float64 `json:"demand"`
	Age       float64 `json:"age"`
	Requester float64 `json:"requester"`
	Proximity float64 `json:"proximity"`
}

type CollectionRequest struct {
	ID             string         `json:"id"`
	RequesterID    string         `json:"requester_id"`
	RequesterName  string         `json:"requester_name"`
	RequesterType  string         `json:"requester_type"`
	WasteType      string         `json:"waste_type"`
	WasteName      string         `json:"waste_name"`
	EstimatedKg    float64        `json:"estimated_kg"`
	Latitude       float64        `json:"latitude"`
	Longitude      float64        `json:"longitude"`
	Address        string         `json:"address"`
	Notes          *string        `json:"notes"`
	Status         string         `json:"status"`
	PriorityScore  float64        `json:"priority_score"`
	ScoreBreakdown *ScoreBreakdown `json:"score_breakdown,omitempty"`
	RouteID        *string        `json:"route_id"`
	CollectedAt    *time.Time     `json:"collected_at"`
	CreatedAt      time.Time      `json:"created_at"`
}

type CollectionRequestInput struct {
	RequesterType string  `json:"requester_type"`
	WasteType     string  `json:"waste_type"`
	EstimatedKg   float64 `json:"estimated_kg"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	Address       string  `json:"address"`
	Notes         *string `json:"notes"`
}

type CollectionRequestStatusInput struct {
	Status string `json:"status"`
}
