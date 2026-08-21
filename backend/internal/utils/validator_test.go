package utils

import "testing"

func TestRequired(t *testing.T) {
	if Required("  ", "name") {
		t.Error("whitespace should not be required-valid")
	}
	if !Required("Kondele", "name") {
		t.Error("non-empty value should be required-valid")
	}
}

func TestInRange(t *testing.T) {
	if !InRange(50, 0, 100) {
		t.Error("50 in [0,100] should be true")
	}
	if InRange(150, 0, 100) {
		t.Error("150 in [0,100] should be false")
	}
}

func TestIn(t *testing.T) {
	if !In("active", "planned", "active", "completed") {
		t.Error("'active' should be in the list")
	}
	if In("bogus", "planned", "active") {
		t.Error("'bogus' should not be in the list")
	}
}
