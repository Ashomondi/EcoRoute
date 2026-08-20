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
