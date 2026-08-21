package models

import "time"

const (
	ProblemOverflow         = "overflow"
	ProblemIllegalDumping   = "illegal_dumping"
	ProblemMissedCollection = "missed_collection"
	ProblemOther            = "other"

	ReportPriorityLow    = "low"
	ReportPriorityMedium = "medium"
	ReportPriorityHigh   = "high"

	ReportStatusOpen       = "open"
	ReportStatusInProgress = "in_progress"
	ReportStatusResolved   = "resolved"
)

type WasteReport struct {
	ID           string    `json:"id"`
	WastePointID *string   `json:"waste_point_id"`
	ReportedBy   string    `json:"reported_by"`
	ProblemType  string    `json:"problem_type"`
	Description  string    `json:"description"`
	PhotoURL     *string   `json:"photo_url"`
	Priority     string    `json:"priority"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

type ReportInput struct {
	WastePointID *string `json:"waste_point_id"`
	ProblemType  string  `json:"problem_type"`
	Description  string  `json:"description"`
	PhotoURL     *string `json:"photo_url"`
}
