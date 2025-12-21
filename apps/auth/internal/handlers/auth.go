package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/duscraft/garry/apps/auth/internal/config"
	"github.com/duscraft/garry/apps/auth/internal/database"
	"github.com/duscraft/garry/apps/auth/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	db     *database.DB
	config *config.Config
}

func New(db *database.DB, cfg *config.Config) *Handler {
	return &Handler{db: db, config: cfg}
}

func (h *Handler) generateAccessToken(userID uuid.UUID) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID.String(),
		"exp": time.Now().Add(time.Duration(h.config.JWTExpiry) * time.Minute).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.config.JWTSecret))
}

func (h *Handler) generateRefreshToken() string {
	return uuid.New().String()
}

func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "garry-auth",
		"version": "1.0.0",
	})
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "validation_error", "Email and password are required")
		return
	}

	if len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "validation_error", "Password must be at least 8 characters")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to process registration")
		return
	}

	dbUser, err := h.db.CreateUser(r.Context(), req.Email, string(hashedPassword), req.Name)
	if err != nil {
		writeError(w, http.StatusConflict, "email_exists", "Email already registered")
		return
	}

	accessToken, err := h.generateAccessToken(dbUser.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to generate token")
		return
	}

	refreshToken := h.generateRefreshToken()
	refreshExpiry := time.Now().Add(time.Duration(h.config.RefreshExpiry) * time.Minute)

	if err := h.db.StoreRefreshToken(r.Context(), dbUser.ID, refreshToken, refreshExpiry); err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to store refresh token")
		return
	}

	user := models.User{
		ID:            dbUser.ID,
		Email:         dbUser.Email,
		Name:          dbUser.Name,
		EmailVerified: dbUser.EmailVerified,
		CreatedAt:     dbUser.CreatedAt,
		UpdatedAt:     dbUser.UpdatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(models.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(h.config.JWTExpiry * 60),
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	dbUser, err := h.db.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.PasswordHash), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	accessToken, err := h.generateAccessToken(dbUser.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to generate token")
		return
	}

	refreshToken := h.generateRefreshToken()
	refreshExpiry := time.Now().Add(time.Duration(h.config.RefreshExpiry) * time.Minute)

	if err := h.db.StoreRefreshToken(r.Context(), dbUser.ID, refreshToken, refreshExpiry); err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to store refresh token")
		return
	}

	user := models.User{
		ID:            dbUser.ID,
		Email:         dbUser.Email,
		Name:          dbUser.Name,
		EmailVerified: dbUser.EmailVerified,
		CreatedAt:     dbUser.CreatedAt,
		UpdatedAt:     dbUser.UpdatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(h.config.JWTExpiry * 60),
	})
}

func (h *Handler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req models.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	userID, err := h.db.GetRefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid_token", "Invalid refresh token")
		return
	}

	dbUser, err := h.db.GetUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "user_not_found", "User not found")
		return
	}

	h.db.DeleteRefreshToken(r.Context(), req.RefreshToken)

	accessToken, err := h.generateAccessToken(dbUser.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to generate token")
		return
	}

	newRefreshToken := h.generateRefreshToken()
	refreshExpiry := time.Now().Add(time.Duration(h.config.RefreshExpiry) * time.Minute)

	if err := h.db.StoreRefreshToken(r.Context(), dbUser.ID, newRefreshToken, refreshExpiry); err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to store refresh token")
		return
	}

	user := models.User{
		ID:            dbUser.ID,
		Email:         dbUser.Email,
		Name:          dbUser.Name,
		EmailVerified: dbUser.EmailVerified,
		CreatedAt:     dbUser.CreatedAt,
		UpdatedAt:     dbUser.UpdatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    int64(h.config.JWTExpiry * 60),
	})
}

func (h *Handler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Context().Value("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_user_id", "Invalid user ID")
		return
	}

	dbUser, err := h.db.GetUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user_not_found", "User not found")
		return
	}

	user := models.User{
		ID:            dbUser.ID,
		Email:         dbUser.Email,
		Name:          dbUser.Name,
		EmailVerified: dbUser.EmailVerified,
		CreatedAt:     dbUser.CreatedAt,
		UpdatedAt:     dbUser.UpdatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	var req models.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err == nil && req.RefreshToken != "" {
		h.db.DeleteRefreshToken(r.Context(), req.RefreshToken)
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	h.db.SetPasswordResetToken(r.Context(), req.Email)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.MessageResponse{
		Message: "If the email exists, a password reset link has been sent",
	})
}

func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	if len(req.NewPassword) < 8 {
		writeError(w, http.StatusBadRequest, "validation_error", "Password must be at least 8 characters")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to process password")
		return
	}

	if err := h.db.ResetPassword(r.Context(), req.Token, string(hashedPassword)); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_token", "Invalid or expired reset token")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.MessageResponse{
		Message: "Password has been reset successfully",
	})
}

func (h *Handler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var req models.VerifyEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	if err := h.db.VerifyEmail(r.Context(), req.Token); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_token", "Invalid verification token")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.MessageResponse{
		Message: "Email verified successfully",
	})
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(models.ErrorResponse{
		Error:   code,
		Message: message,
	})
}
