package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DBHost       string
	DBPort       string
	DBUser       string
	DBPassword   string
	DBName       string
	JWTSecret    string
	JWTTTL       time.Duration
	AIServiceURL string
	AITimeout    time.Duration
	AdminInvite  string

	CORSAllowedOrigins []string
	RateLimitRequests  int
	RateLimitWindow    time.Duration

	UploadDir string
	UploadURL string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Port:         getEnv("PORT", "8080"),
		DBHost:       getEnv("DB_HOST", "localhost"),
		DBPort:       getEnv("DB_PORT", "5432"),
		DBUser:       getEnv("DB_USER", "ecoroute"),
		DBPassword:   getEnv("DB_PASSWORD", "ecoroute"),
		DBName:       getEnv("DB_NAME", "ecoroute"),
		JWTSecret:    os.Getenv("JWT_SECRET"),
		JWTTTL:       24 * time.Hour,
		AIServiceURL: getEnv("AI_SERVICE_URL", "http://localhost:8000"),
		AITimeout:    2 * time.Second,
		AdminInvite:  os.Getenv("ADMIN_INVITE_CODE"),

		CORSAllowedOrigins: splitList(getEnv("CORS_ALLOWED_ORIGINS", "*")),
		RateLimitRequests:  120,
		RateLimitWindow:    time.Minute,

		UploadDir: getEnv("UPLOAD_DIR", "./uploads"),
		UploadURL: getEnv("UPLOAD_URL", "/uploads"),
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	if v := os.Getenv("JWT_TTL"); v != "" {
		d, err := time.ParseDuration(v)
		if err != nil {
			return nil, fmt.Errorf("invalid JWT_TTL: %w", err)
		}
		cfg.JWTTTL = d
	}

	if v := os.Getenv("AI_TIMEOUT"); v != "" {
		d, err := time.ParseDuration(v)
		if err != nil {
			return nil, fmt.Errorf("invalid AI_TIMEOUT: %w", err)
		}
		cfg.AITimeout = d
	}

	if v := os.Getenv("RATE_LIMIT_REQUESTS"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n <= 0 {
			return nil, fmt.Errorf("invalid RATE_LIMIT_REQUESTS: %q", v)
		}
		cfg.RateLimitRequests = n
	}

	if v := os.Getenv("RATE_LIMIT_WINDOW"); v != "" {
		d, err := time.ParseDuration(v)
		if err != nil {
			return nil, fmt.Errorf("invalid RATE_LIMIT_WINDOW: %w", err)
		}
		cfg.RateLimitWindow = d
	}

	return cfg, nil
}

func (c *Config) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}

func splitList(v string) []string {
	parts := strings.Split(v, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
