package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/duscraft/garry/apps/auth/internal/config"
	"github.com/duscraft/garry/apps/auth/internal/database"
	"github.com/duscraft/garry/apps/auth/internal/models"
	"github.com/duscraft/garry/apps/auth/internal/redis"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

type Handler struct {
	db         *database.DB
	tokenStore *redis.TokenStore
	config     *config.Config
	logger     *slog.Logger
}

func New(db *database.DB, tokenStore *redis.TokenStore, cfg *config.Config, logger *slog.Logger) *Handler {
	return &Handler{
		db:         db,
		tokenStore: tokenStore,
		config:     cfg,
		logger:     logger,
	}
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
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	dbHealthy := h.db.Ping(ctx) == nil
	redisHealthy := h.tokenStore.Ping(ctx) == nil

	status := "healthy"
	httpStatus := http.StatusOK

	if !dbHealthy || !redisHealthy {
		status = "unhealthy"
		httpStatus = http.StatusServiceUnavailable
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  status,
		"service": "garry-auth",
		"version": "1.0.0",
		"checks": map[string]bool{
			"database": dbHealthy,
			"redis":    redisHealthy,
		},
	})
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Warn("invalid request body", "error", err)
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	req.Email = sanitizeEmail(req.Email)
	req.Name = sanitizeString(req.Name, 100)

	if !isValidEmail(req.Email) {
		writeError(w, http.StatusBadRequest, "validation_error", "Invalid email format")
		return
	}

	if !isValidPassword(req.Password) {
		writeError(w, http.StatusBadRequest, "validation_error", "Password must be 8-128 characters with at least one uppercase, one lowercase, and one number")
		return
	}

	if len(req.Name) < 1 || len(req.Name) > 100 {
		writeError(w, http.StatusBadRequest, "validation_error", "Name must be between 1 and 100 characters")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), h.config.BcryptCost)
	if err != nil {
		h.logger.Error("failed to hash password", "error", err)
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to process registration")
		return
	}

	dbUser, err := h.db.CreateUser(r.Context(), req.Email, string(hashedPassword), req.Name)
	if err != nil {
		h.logger.Warn("failed to create user", "email", req.Email, "error", err)
		writeError(w, http.StatusConflict, "email_exists", "Email already registered")
		return
	}

	accessToken, err := h.generateAccessToken(dbUser.ID)
	if err != nil {
		h.logger.Error("failed to generate access token", "error", err)
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to generate token")
		return
	}

	refreshToken := h.generateRefreshToken()
	refreshExpiry := time.Duration(h.config.RefreshExpiry) * time.Minute

	if err := h.tokenStore.StoreRefreshToken(r.Context(), dbUser.ID, refreshToken, refreshExpiry); err != nil {
		h.logger.Error("failed to store refresh token", "error", err)
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to store refresh token")
		return
	}

	h.logger.Info("user registered", "user_id", dbUser.ID, "email", dbUser.Email)

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

	req.Email = sanitizeEmail(req.Email)

	if !isValidEmail(req.Email) {
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	dbUser, err := h.db.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		h.logger.Warn("login attempt for non-existent user", "email", req.Email)
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.PasswordHash), []byte(req.Password)); err != nil {
		h.logger.Warn("invalid password attempt", "user_id", dbUser.ID)
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	accessToken, err := h.generateAccessToken(dbUser.ID)
	if err != nil {
		h.logger.Error("failed to generate access token", "error", err)
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to generate token")
		return
	}

	refreshToken := h.generateRefreshToken()
	refreshExpiry := time.Duration(h.config.RefreshExpiry) * time.Minute

	if err := h.tokenStore.StoreRefreshToken(r.Context(), dbUser.ID, refreshToken, refreshExpiry); err != nil {
		h.logger.Error("failed to store refresh token", "error", err)
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to store refresh token")
		return
	}

	h.logger.Info("user logged in", "user_id", dbUser.ID)

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

	if req.RefreshToken == "" {
		writeError(w, http.StatusBadRequest, "validation_error", "Refresh token is required")
		return
	}

	userID, err := h.tokenStore.GetRefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		h.logger.Warn("invalid refresh token attempt")
		writeError(w, http.StatusUnauthorized, "invalid_token", "Invalid refresh token")
		return
	}

	dbUser, err := h.db.GetUserByID(r.Context(), userID)
	if err != nil {
		h.logger.Warn("user not found for refresh token", "user_id", userID)
		writeError(w, http.StatusUnauthorized, "user_not_found", "User not found")
		return
	}

	h.tokenStore.DeleteRefreshToken(r.Context(), req.RefreshToken)

	accessToken, err := h.generateAccessToken(dbUser.ID)
	if err != nil {
		h.logger.Error("failed to generate access token", "error", err)
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to generate token")
		return
	}

	newRefreshToken := h.generateRefreshToken()
	refreshExpiry := time.Duration(h.config.RefreshExpiry) * time.Minute

	if err := h.tokenStore.StoreRefreshToken(r.Context(), dbUser.ID, newRefreshToken, refreshExpiry); err != nil {
		h.logger.Error("failed to store refresh token", "error", err)
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to store refresh token")
		return
	}

	h.logger.Info("token refreshed", "user_id", dbUser.ID)

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
		h.tokenStore.DeleteRefreshToken(r.Context(), req.RefreshToken)
	}

	h.logger.Info("user logged out")
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	req.Email = sanitizeEmail(req.Email)

	if isValidEmail(req.Email) {
		token := uuid.New().String()
		h.tokenStore.StorePasswordResetToken(r.Context(), req.Email, token, 1*time.Hour)
		h.logger.Info("password reset requested", "email", req.Email)
	}

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

	if !isValidPassword(req.NewPassword) {
		writeError(w, http.StatusBadRequest, "validation_error", "Password must be 8-128 characters with at least one uppercase, one lowercase, and one number")
		return
	}

	email, err := h.tokenStore.GetPasswordResetToken(r.Context(), req.Token)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_token", "Invalid or expired reset token")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), h.config.BcryptCost)
	if err != nil {
		h.logger.Error("failed to hash password", "error", err)
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to process password")
		return
	}

	if err := h.db.ResetPasswordByEmail(r.Context(), email, string(hashedPassword)); err != nil {
		h.logger.Error("failed to reset password", "error", err)
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to reset password")
		return
	}

	h.tokenStore.DeletePasswordResetToken(r.Context(), req.Token)
	h.logger.Info("password reset completed", "email", email)

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

	h.logger.Info("email verified", "token", req.Token[:8]+"...")

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

func sanitizeEmail(email string) string {
	email = strings.TrimSpace(email)
	email = strings.ToLower(email)
	return email
}

func sanitizeString(s string, maxLen int) string {
	s = strings.TrimSpace(s)
	s = strings.Map(func(r rune) rune {
		if r == '<' || r == '>' || r == '&' || r == '"' || r == '\'' {
			return -1
		}
		return r
	}, s)
	if utf8.RuneCountInString(s) > maxLen {
		runes := []rune(s)
		s = string(runes[:maxLen])
	}
	return s
}

func isValidEmail(email string) bool {
	if len(email) > 254 {
		return false
	}
	return emailRegex.MatchString(email)
}

func isValidPassword(password string) bool {
	if len(password) < 8 || len(password) > 128 {
		return false
	}

	hasUpper := false
	hasLower := false
	hasNumber := false

	for _, c := range password {
		switch {
		case c >= 'A' && c <= 'Z':
			hasUpper = true
		case c >= 'a' && c <= 'z':
			hasLower = true
		case c >= '0' && c <= '9':
			hasNumber = true
		}
	}

	return hasUpper && hasLower && hasNumber
}
