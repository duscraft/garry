package main

import (
	"log"
	"net/http"
	"os"

	"github.com/duscraft/garry/apps/auth/internal/handlers"
	"github.com/duscraft/garry/apps/auth/internal/middleware"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	r := chi.NewRouter()

	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.CORS)

	r.Get("/health", handlers.HealthCheck)

	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Post("/register", handlers.Register)
		r.Post("/login", handlers.Login)
		r.Post("/refresh", handlers.RefreshToken)

		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthRequired)
			r.Get("/me", handlers.GetCurrentUser)
			r.Post("/logout", handlers.Logout)
		})
	})

	log.Printf("🔐 Garry Auth Service starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
