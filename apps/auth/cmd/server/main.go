package main

import (
	"log"
	"net/http"

	"github.com/duscraft/garry/apps/auth/internal/config"
	"github.com/duscraft/garry/apps/auth/internal/database"
	"github.com/duscraft/garry/apps/auth/internal/handlers"
	"github.com/duscraft/garry/apps/auth/internal/middleware"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	cfg := config.Load()

	db, err := database.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	h := handlers.New(db, cfg)

	r := chi.NewRouter()

	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.CORS)

	r.Get("/health", h.HealthCheck)

	r.Route("/api/v1/auth", func(r chi.Router) {
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

	log.Printf("Garry Auth Service starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
