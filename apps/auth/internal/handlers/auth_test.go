package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/duscraft/garry/apps/auth/internal/config"
	"github.com/duscraft/garry/apps/auth/internal/models"
)

func TestHealthCheck(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	handler.HealthCheck(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]string
	if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if response["status"] != "healthy" {
		t.Errorf("expected status 'healthy', got '%s'", response["status"])
	}

	if response["service"] != "garry-auth" {
		t.Errorf("expected service 'garry-auth', got '%s'", response["service"])
	}
}

func TestRegister_InvalidBody(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestRegister_MissingEmail(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	body := models.RegisterRequest{
		Password: "password123",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(bodyBytes))
	w := httptest.NewRecorder()

	handler.Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var response models.ErrorResponse
	json.NewDecoder(w.Body).Decode(&response)

	if response.Error != "validation_error" {
		t.Errorf("expected error 'validation_error', got '%s'", response.Error)
	}
}

func TestRegister_ShortPassword(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	body := models.RegisterRequest{
		Email:    "test@example.com",
		Password: "short",
		Name:     "Test User",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(bodyBytes))
	w := httptest.NewRecorder()

	handler.Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var response models.ErrorResponse
	json.NewDecoder(w.Body).Decode(&response)

	if response.Error != "validation_error" {
		t.Errorf("expected error 'validation_error', got '%s'", response.Error)
	}
}

func TestLogin_InvalidBody(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.Login(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestRefreshToken_InvalidBody(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	req := httptest.NewRequest(http.MethodPost, "/refresh", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.RefreshToken(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestLogout_EmptyBody(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	req := httptest.NewRequest(http.MethodPost, "/logout", bytes.NewBufferString(""))
	w := httptest.NewRecorder()

	handler.Logout(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected status %d, got %d", http.StatusNoContent, w.Code)
	}
}

func TestForgotPassword_InvalidBody(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	req := httptest.NewRequest(http.MethodPost, "/forgot-password", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.ForgotPassword(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestResetPassword_InvalidBody(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	req := httptest.NewRequest(http.MethodPost, "/reset-password", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.ResetPassword(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestResetPassword_ShortPassword(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	body := models.ResetPasswordRequest{
		Token:       "some-token",
		NewPassword: "short",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/reset-password", bytes.NewBuffer(bodyBytes))
	w := httptest.NewRecorder()

	handler.ResetPassword(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestVerifyEmail_InvalidBody(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	req := httptest.NewRequest(http.MethodPost, "/verify-email", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.VerifyEmail(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestWriteError(t *testing.T) {
	w := httptest.NewRecorder()

	writeError(w, http.StatusBadRequest, "test_error", "Test message")

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var response models.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if response.Error != "test_error" {
		t.Errorf("expected error 'test_error', got '%s'", response.Error)
	}

	if response.Message != "Test message" {
		t.Errorf("expected message 'Test message', got '%s'", response.Message)
	}
}

func TestGenerateRefreshToken(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
	}
	handler := &Handler{db: nil, config: cfg}

	token1 := handler.generateRefreshToken()
	token2 := handler.generateRefreshToken()

	if token1 == "" {
		t.Error("refresh token should not be empty")
	}

	if token1 == token2 {
		t.Error("refresh tokens should be unique")
	}

	if len(token1) != 36 {
		t.Errorf("refresh token should be UUID format (36 chars), got %d", len(token1))
	}
}
