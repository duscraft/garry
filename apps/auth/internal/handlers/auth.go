package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/duscraft/garry/apps/auth/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var users = make(map[string]*models.User)
var refreshTokens = make(map[string]string)

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "garry-dev-secret-change-in-production"
	}
	return []byte(secret)
}

func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func generateToken(userID string, duration time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(duration).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "garry-auth",
		"version": "1.0.0",
	})
}

func Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "validation_error", "Email and password are required")
		return
	}

	for _, u := range users {
		if u.Email == req.Email {
			writeError(w, http.StatusConflict, "email_exists", "Email already registered")
			return
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to process registration")
		return
	}

	user := &models.User{
		ID:        generateID(),
		Email:     req.Email,
		Password:  string(hashedPassword),
		Name:      req.Name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	users[user.ID] = user

	accessToken, _ := generateToken(user.ID, 15*time.Minute)
	refreshToken := generateID()
	refreshTokens[refreshToken] = user.ID

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(models.AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    900,
	})
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	var foundUser *models.User
	for _, u := range users {
		if u.Email == req.Email {
			foundUser = u
			break
		}
	}

	if foundUser == nil {
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(foundUser.Password), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	accessToken, _ := generateToken(foundUser.ID, 15*time.Minute)
	refreshToken := generateID()
	refreshTokens[refreshToken] = foundUser.ID

	json.NewEncoder(w).Encode(models.AuthResponse{
		User:         *foundUser,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    900,
	})
}

func RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req models.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	userID, exists := refreshTokens[req.RefreshToken]
	if !exists {
		writeError(w, http.StatusUnauthorized, "invalid_token", "Invalid refresh token")
		return
	}

	user, exists := users[userID]
	if !exists {
		writeError(w, http.StatusUnauthorized, "user_not_found", "User not found")
		return
	}

	delete(refreshTokens, req.RefreshToken)

	accessToken, _ := generateToken(user.ID, 15*time.Minute)
	newRefreshToken := generateID()
	refreshTokens[newRefreshToken] = user.ID

	json.NewEncoder(w).Encode(models.AuthResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    900,
	})
}

func GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	user, exists := users[userID]
	if !exists {
		writeError(w, http.StatusNotFound, "user_not_found", "User not found")
		return
	}
	json.NewEncoder(w).Encode(user)
}

func Logout(w http.ResponseWriter, r *http.Request) {
	var req models.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err == nil && req.RefreshToken != "" {
		delete(refreshTokens, req.RefreshToken)
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(models.ErrorResponse{
		Error:   code,
		Message: message,
	})
}
