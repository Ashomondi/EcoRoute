package models

import "time"

type CommunitySummary struct {
	ReportsMade     int     `json:"reports_made"`
	WasteDivertedKg float64 `json:"waste_diverted_kg"`
	Rank            int     `json:"rank"`
	TotalReporters  int     `json:"total_reporters"`
}

type ActivityItem struct {
	Type    string    `json:"type"`
	Message string    `json:"message"`
	Time    time.Time `json:"time"`
}

// ScheduledCollection is a collection stop on a planned or active route that
// has not been collected yet. Related marks points the resident reported on.
type ScheduledCollection struct {
	WastePointID      string  `json:"waste_point_id"`
	WastePointName    string  `json:"waste_point_name"`
	Latitude          float64 `json:"latitude"`
	Longitude         float64 `json:"longitude"`
	CurrentLevelPct   int     `json:"current_level_pct"`
	Status            string  `json:"status"`
	RouteID           string  `json:"route_id"`
	RouteStatus       string  `json:"route_status"`
	Order             int     `json:"order"`
	StopCount         int     `json:"stop_count"`
	EstimatedMinutes  int     `json:"estimated_minutes"`
	TruckRegistration string  `json:"truck_registration"`
	Related           bool    `json:"related"`
}

type PastCollection struct {
	ID             string    `json:"id"`
	WastePointID   string    `json:"waste_point_id"`
	WastePointName string    `json:"waste_point_name"`
	Outcome        string    `json:"outcome"`
	EstimatedKg    float64   `json:"estimated_kg"`
	CollectedAt    time.Time `json:"collected_at"`
}

type CommunityCollections struct {
	Upcoming []ScheduledCollection `json:"upcoming"`
	Past     []PastCollection      `json:"past"`
}
