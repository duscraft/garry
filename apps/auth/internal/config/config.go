package config

import (
	"log"
	"os"
	"strconv"
)

type Config struct {
	Port           string
	DatabaseURL    string
	RedisURL       string
	JWTSecret      string
	JWTExpiry      int
	RefreshExpiry  int
	BcryptCost     int
	SMTPHost       string
	SMTPPort       string
	SMTPUser       string
	SMTPPassword   string
	FromEmail      string
	FrontendURL    string
	CORSOrigins    string
	Environment    string
	RateLimitRPS   int
	RateLimitBurst int
}

func Load() *Config {
	env := getEnv("ENVIRONMENT", "development")
	isProd := env == "production"

	jwtSecret := getEnv("JWT_SECRET", "")
	if isProd && jwtSecret == "" {
		log.Fatal("JWT_SECRET must be set in production")
	}
	if jwtSecret == "" {
		jwtSecret = "garry-dev-secret-change-in-production"
	}

	databaseURL := getEnv("DATABASE_URL", "")
	if isProd && databaseURL == "" {
		log.Fatal("DATABASE_URL must be set in production")
	}
	if databaseURL == "" {
		databaseURL = "postgres://garry:garry@localhost:5432/garry?sslmode=disable"
	}

	redisURL := getEnv("REDIS_URL", "")
	if isProd && redisURL == "" {
		log.Fatal("REDIS_URL must be set in production")
	}
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	bcryptCost := 12
	if costStr := getEnv("BCRYPT_COST", ""); costStr != "" {
		if cost, err := strconv.Atoi(costStr); err == nil && cost >= 10 && cost <= 14 {
			bcryptCost = cost
		}
	}

	rateLimitRPS := 10
	if rps := getEnv("RATE_LIMIT_RPS", ""); rps != "" {
		if val, err := strconv.Atoi(rps); err == nil {
			rateLimitRPS = val
		}
	}

	rateLimitBurst := 20
	if burst := getEnv("RATE_LIMIT_BURST", ""); burst != "" {
		if val, err := strconv.Atoi(burst); err == nil {
			rateLimitBurst = val
		}
	}

	return &Config{
		Port:           getEnv("PORT", "8081"),
		DatabaseURL:    databaseURL,
		RedisURL:       redisURL,
		JWTSecret:      jwtSecret,
		JWTExpiry:      15,
		RefreshExpiry:  7 * 24 * 60,
		BcryptCost:     bcryptCost,
		SMTPHost:       getEnv("SMTP_HOST", ""),
		SMTPPort:       getEnv("SMTP_PORT", "587"),
		SMTPUser:       getEnv("SMTP_USER", ""),
		SMTPPassword:   getEnv("SMTP_PASSWORD", ""),
		FromEmail:      getEnv("FROM_EMAIL", "noreply@garry.app"),
		FrontendURL:    getEnv("FRONTEND_URL", "http://localhost:5173"),
		CORSOrigins:    getEnv("CORS_ORIGINS", "http://localhost:3000"),
		Environment:    env,
		RateLimitRPS:   rateLimitRPS,
		RateLimitBurst: rateLimitBurst,
	}
}

func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
