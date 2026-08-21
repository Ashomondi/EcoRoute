package utils

import "strings"

func Required(value, field string) bool {
	return strings.TrimSpace(value) != ""
}

func InRange(n, min, max int) bool {
	return n >= min && n <= max
}

func In(value string, allowed ...string) bool {
	for _, a := range allowed {
		if value == a {
			return true
		}
	}
	return false
}
