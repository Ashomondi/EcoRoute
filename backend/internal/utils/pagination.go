package utils

import (
	"net/http"
	"strconv"
)

type Page struct {
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
}

func ParsePagination(r *http.Request, defaultLimit, maxLimit int) Page {
	limit := defaultLimit
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = n
		}
	}
	if limit > maxLimit {
		limit = maxLimit
	}

	offset := 0
	if v := r.URL.Query().Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			offset = n
		}
	}
	return Page{Limit: limit, Offset: offset}
}
