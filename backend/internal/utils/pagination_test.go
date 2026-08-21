package utils

import (
	"net/http/httptest"
	"testing"
)

func TestParsePaginationDefaults(t *testing.T) {
	r := httptest.NewRequest("GET", "/items", nil)
	p := ParsePagination(r, 25, 100)
	if p.Limit != 25 || p.Offset != 0 {
		t.Errorf("got %+v, want limit=25 offset=0", p)
	}
}

func TestParsePaginationParsesAndClamps(t *testing.T) {
	r := httptest.NewRequest("GET", "/items?limit=500&offset=10", nil)
	p := ParsePagination(r, 25, 100)
	if p.Limit != 100 {
		t.Errorf("limit = %d, want clamped to 100", p.Limit)
	}
	if p.Offset != 10 {
		t.Errorf("offset = %d, want 10", p.Offset)
	}
}

func TestParsePaginationIgnoresGarbage(t *testing.T) {
	r := httptest.NewRequest("GET", "/items?limit=abc&offset=-3", nil)
	p := ParsePagination(r, 25, 100)
	if p.Limit != 25 || p.Offset != 0 {
		t.Errorf("got %+v, want defaults", p)
	}
}
