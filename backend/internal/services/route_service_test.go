package services

import (
	"testing"

	"ecoroute/backend/internal/models"
)

var testPoints = []models.WastePoint{
	{ID: "a", Name: "A", Latitude: -0.0917, Longitude: 34.7680},
	{ID: "b", Name: "B", Latitude: -0.0844, Longitude: 34.7700},
	{ID: "c", Name: "C", Latitude: -0.0737, Longitude: 34.7071},
	{ID: "d", Name: "D", Latitude: -0.0850, Longitude: 34.7890},
}

func TestEstimateTimeFuel(t *testing.T) {
	min, fuel := estimateTimeFuel(25, 3)
	if min != 90 {
		t.Errorf("estimateTimeFuel(25,3) minutes = %d, want 90", min)
	}
	if fuel != 5.3 {
		t.Errorf("estimateTimeFuel(25,3) fuel = %v, want 5.3", fuel)
	}
}

func TestStatusRank(t *testing.T) {
	if statusRank(models.StatusCritical) >= statusRank(models.StatusWarning) {
		t.Error("critical should rank above warning")
	}
	if statusRank(models.StatusWarning) >= statusRank(models.StatusOK) {
		t.Error("warning should rank above ok")
	}
}

func TestNearestNeighborDeterministic(t *testing.T) {
	tLat, tLng := -0.1022, 34.7617
	r1 := nearestNeighbor(testPoints, tLat, tLng)
	r2 := nearestNeighbor(testPoints, tLat, tLng)
	if !samePointOrder(r1, r2) {
		t.Error("nearestNeighbor is not deterministic")
	}
	if len(r1) != len(testPoints) {
		t.Errorf("nearestNeighbor dropped points: got %d, want %d", len(r1), len(testPoints))
	}
}

func TestTwoOptNeverWorsens(t *testing.T) {
	tLat, tLng := -0.1022, 34.7617
	before := routeLength(testPoints, tLat, tLng)
	optimized := twoOpt(testPoints, tLat, tLng)
	after := routeLength(optimized, tLat, tLng)
	if after > before+1e-9 {
		t.Errorf("twoOpt worsened route: %v -> %v", before, after)
	}

	again := twoOpt(append([]models.WastePoint{}, testPoints...), tLat, tLng)
	if !samePointOrder(optimized, again) {
		t.Error("twoOpt is not deterministic")
	}
}

func samePointOrder(a, b []models.WastePoint) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].ID != b[i].ID {
			return false
		}
	}
	return true
}
