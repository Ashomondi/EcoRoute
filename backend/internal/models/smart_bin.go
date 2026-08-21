package models

import "time"

const (
	ReadTriggerManual    = "manual"
	ReadTriggerFull      = "full"
	ReadTriggerScheduled = "scheduled"

	ReadingStatusPending   = "pending"
	ReadingStatusCollected = "collected"
	ReadingStatusCleared   = "cleared"
)

type SmartBinReading struct {
	ID              string             `json:"id"`
	WastePointID    string             `json:"waste_point_id"`
	WastePointName  string             `json:"waste_point_name,omitempty"`
	Category        string             `json:"category"`
	CategoryName    string             `json:"category_name,omitempty"`
	TotalKg         float64            `json:"total_kg"`
	Composition     map[string]float64 `json:"composition"`
	PrimaryCategory string             `json:"primary_category"`
	Confidence      float64            `json:"confidence"`
	TriggerType     string             `json:"trigger_type"`
	Status          string             `json:"status"`
	CreatedAt       time.Time          `json:"created_at"`
}

type SmartBinReadInput struct {
	Trigger string `json:"trigger"`
}

type CategoryKg struct {
	Category     string  `json:"category"`
	CategoryName string  `json:"category_name"`
	Kg           float64 `json:"kg"`
	Percent      float64 `json:"percent"`
}

type SmartBinAnalytics struct {
	BinsMonitored   int           `json:"bins_monitored"`
	BinsWithReading int           `json:"bins_with_reading"`
	BinsFull        int           `json:"bins_full"`
	PendingReadings int           `json:"pending_readings"`
	TotalKg         float64       `json:"total_kg"`
	Composition     []CategoryKg  `json:"composition"`
	Readings        []SmartBinReading `json:"readings"`
}
