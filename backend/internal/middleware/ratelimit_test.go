package middleware

import (
	"testing"
	"time"
)

func TestRateLimiterAllowsUpToLimit(t *testing.T) {
	rl := newRateLimiter(3, time.Minute)
	for i := 0; i < 3; i++ {
		if !rl.allow("1.2.3.4") {
			t.Fatalf("request %d should be allowed", i+1)
		}
	}
	if rl.allow("1.2.3.4") {
		t.Error("4th request should be blocked")
	}
	if !rl.allow("9.9.9.9") {
		t.Error("a different IP should not be blocked")
	}
}

func TestRateLimiterWindowExpires(t *testing.T) {
	rl := newRateLimiter(1, time.Millisecond)
	if !rl.allow("1.1.1.1") {
		t.Fatal("first request should be allowed")
	}
	if rl.allow("1.1.1.1") {
		t.Fatal("second request within window should be blocked")
	}
	time.Sleep(2 * time.Millisecond)
	if !rl.allow("1.1.1.1") {
		t.Error("request after window expiry should be allowed")
	}
}
