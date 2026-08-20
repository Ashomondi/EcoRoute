package config

import (
	"fmt"
	"log"
	"os"
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
}

func Load() (*Config, error) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("failed to load .env")
	}

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

	return cfg, nil
}

func (c *Config) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}
