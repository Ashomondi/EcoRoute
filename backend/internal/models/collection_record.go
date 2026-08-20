package models

import "time"

const (
	OutcomeCollected = "collected"
	OutcomeFailed    = "failed"
)

type CollectionRecord struct {
	ID           string    `json:"id"`
	RouteID      string    `json:"route_id"`
	WastePointID string    `json:"waste_point_id"`
	TruckID      string    `json:"truck_id"`
	Outcome      string    `json:"outcome"`
	CollectedAt  time.Time `json:"collected_at"`
}
