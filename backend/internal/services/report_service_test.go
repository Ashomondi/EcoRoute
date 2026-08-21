package services

import (
	"testing"

	"ecoroute/backend/internal/models"
)

func TestPriorityFor(t *testing.T) {
	cases := []struct {
		problemType string
		want        string
	}{
		{models.ProblemOverflow, models.ReportPriorityHigh},
		{models.ProblemMissedCollection, models.ReportPriorityHigh},
		{models.ProblemIllegalDumping, models.ReportPriorityMedium},
		{models.ProblemOther, models.ReportPriorityMedium},
	}
	for _, c := range cases {
		if got := priorityFor(c.problemType); got != c.want {
			t.Errorf("priorityFor(%q) = %q, want %q", c.problemType, got, c.want)
		}
	}
}

func TestCO2Conversion(t *testing.T) {
	// 1 L diesel -> 2.68 kg CO2; a 2 L saving should yield 5.36 kg.
	if got := 2.0 * co2KgPerLitreFuel; got != 5.36 {
		t.Errorf("expected 5.36 kg CO2 for 2 L, got %v", got)
	}
}
