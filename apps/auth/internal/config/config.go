package config

import (
	"os"
)

type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	JWTExpiry     int
	RefreshExpiry int
	SMTPHost      string
	SMTPPort      string
	SMTPUser      string
	SMTPPassword  string
	FromEmail     string
	FrontendURL   string
}

func Load() *Config {
	return &Config{
		Port:          getEnv("PORT", "8081"),
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://garry:garry@localhost:5432/garry?sslmode=disable"),
		JWTSecret:     getEnv("JWT_SECRET", "garry-dev-secret-change-in-production"),
		JWTExpiry:     15,
		RefreshExpiry: 7 * 24 * 60,
		SMTPHost:      getEnv("SMTP_HOST", ""),
		SMTPPort:      getEnv("SMTP_PORT", "587"),
		SMTPUser:      getEnv("SMTP_USER", ""),
		SMTPPassword:  getEnv("SMTP_PASSWORD", ""),
		FromEmail:     getEnv("FROM_EMAIL", "noreply@garry.app"),
		FrontendURL:   getEnv("FRONTEND_URL", "http://localhost:5173"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
