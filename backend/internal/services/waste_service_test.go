package services

import (
	"testing"

	"ecoroute/backend/internal/models"
)

func TestStatusForLevel(t *testing.T) {
	cases := []struct {
		level int
		want  string
	}{
		{0, models.StatusOK},
		{59, models.StatusOK},
		{60, models.StatusWarning},
		{84, models.StatusWarning},
		{85, models.StatusCritical},
		{100, models.StatusCritical},
	}
	for _, c := range cases {
		if got := StatusForLevel(c.level); got != c.want {
			t.Errorf("StatusForLevel(%d) = %s, want %s", c.level, got, c.want)
		}
	}
}
