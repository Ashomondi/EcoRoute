package utils

import "testing"

func TestHaversineKmSamePoint(t *testing.T) {
	if d := HaversineKm(0, 0, 0, 0); d != 0 {
		t.Errorf("HaversineKm(0,0,0,0) = %v, want 0", d)
	}
}

func TestHaversineKmEquatorDegree(t *testing.T) {
	d := HaversineKm(0, 0, 0, 1)
	if d < 110 || d > 112 {
		t.Errorf("HaversineKm(0,0,0,1) = %v, want ~111.19 km", d)
	}
}
