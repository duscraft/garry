package main

import (
	"log"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/duscraft/garry/apps/auth/internal/config"
	"github.com/duscraft/garry/apps/auth/internal/database"
	"github.com/duscraft/garry/apps/auth/internal/handlers"
	"github.com/duscraft/garry/apps/auth/internal/middleware"
	"github.com/duscraft/garry/apps/auth/internal/redis"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	cfg := config.Load()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	db, err := database.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	logger.Info("connected to database")

	tokenStore, err := redis.NewTokenStore(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer tokenStore.Close()
	logger.Info("connected to redis")

	h := handlers.New(db, tokenStore, cfg, logger)

	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(structuredLogger(logger))
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.CORSWithOrigins(cfg.CORSOrigins))

	r.Get("/health", h.HealthCheck)

	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Use(httprate.Limit(
			cfg.RateLimitRPS,
			time.Second,
			httprate.WithKeyFuncs(httprate.KeyByIP),
			httprate.WithLimitHandler(func(w http.ResponseWriter, r *http.Request) {
				http.Error(w, `{"error":"rate_limit","message":"Too many requests"}`, http.StatusTooManyRequests)
			}),
		))

		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
		r.Post("/refresh", h.RefreshToken)
		r.Post("/forgot-password", h.ForgotPassword)
		r.Post("/reset-password", h.ResetPassword)
		r.Post("/verify-email", h.VerifyEmail)

		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthRequired(cfg.JWTSecret))
			r.Get("/me", h.GetCurrentUser)
			r.Post("/logout", h.Logout)
		})
	})

	logger.Info("starting garry-auth", "port", cfg.Port, "environment", cfg.Environment)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}

func structuredLogger(logger *slog.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := chimiddleware.NewWrapResponseWriter(w, r.ProtoMajor)

			defer func() {
				logger.Info("request",
					"method", r.Method,
					"path", r.URL.Path,
					"status", ww.Status(),
					"duration_ms", time.Since(start).Milliseconds(),
					"request_id", chimiddleware.GetReqID(r.Context()),
					"remote_addr", r.RemoteAddr,
				)
			}()

			next.ServeHTTP(ww, r)
		})
	}
}

func corsOrigins(origins string) []string {
	return strings.Split(origins, ",")
}
