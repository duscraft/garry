package handlers

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/duscraft/garry/apps/auth/internal/config"
	"github.com/duscraft/garry/apps/auth/internal/models"
)

func newTestHandler() *Handler {
	cfg := &config.Config{
		JWTSecret:     "test-secret",
		JWTExpiry:     60,
		RefreshExpiry: 10080,
		BcryptCost:    4,
	}
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	return &Handler{db: nil, tokenStore: nil, config: cfg, logger: logger}
}

func TestHealthCheck_WithoutDeps(t *testing.T) {
	t.Skip("Requires database and redis connections")
}

func TestRegister_InvalidBody(t *testing.T) {
	handler := newTestHandler()

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestRegister_MissingEmail(t *testing.T) {
	handler := newTestHandler()

	body := models.RegisterRequest{
		Password: "Password123",
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

func TestRegister_InvalidEmailFormat(t *testing.T) {
	handler := newTestHandler()

	body := models.RegisterRequest{
		Email:    "not-an-email",
		Password: "Password123",
		Name:     "Test User",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(bodyBytes))
	w := httptest.NewRecorder()

	handler.Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestRegister_ShortPassword(t *testing.T) {
	handler := newTestHandler()

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

func TestRegister_PasswordWithoutUppercase(t *testing.T) {
	handler := newTestHandler()

	body := models.RegisterRequest{
		Email:    "test@example.com",
		Password: "password123",
		Name:     "Test User",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(bodyBytes))
	w := httptest.NewRecorder()

	handler.Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestRegister_PasswordWithoutNumber(t *testing.T) {
	handler := newTestHandler()

	body := models.RegisterRequest{
		Email:    "test@example.com",
		Password: "PasswordABC",
		Name:     "Test User",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(bodyBytes))
	w := httptest.NewRecorder()

	handler.Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestLogin_InvalidBody(t *testing.T) {
	handler := newTestHandler()

	req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.Login(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestRefreshToken_InvalidBody(t *testing.T) {
	handler := newTestHandler()

	req := httptest.NewRequest(http.MethodPost, "/refresh", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.RefreshToken(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestRefreshToken_EmptyToken(t *testing.T) {
	handler := newTestHandler()

	body := models.RefreshRequest{RefreshToken: ""}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/refresh", bytes.NewBuffer(bodyBytes))
	w := httptest.NewRecorder()

	handler.RefreshToken(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestLogout_EmptyBody(t *testing.T) {
	handler := newTestHandler()

	req := httptest.NewRequest(http.MethodPost, "/logout", bytes.NewBufferString(""))
	w := httptest.NewRecorder()

	handler.Logout(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected status %d, got %d", http.StatusNoContent, w.Code)
	}
}

func TestForgotPassword_InvalidBody(t *testing.T) {
	handler := newTestHandler()

	req := httptest.NewRequest(http.MethodPost, "/forgot-password", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.ForgotPassword(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestResetPassword_InvalidBody(t *testing.T) {
	handler := newTestHandler()

	req := httptest.NewRequest(http.MethodPost, "/reset-password", bytes.NewBufferString("invalid json"))
	w := httptest.NewRecorder()

	handler.ResetPassword(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestResetPassword_ShortPassword(t *testing.T) {
	handler := newTestHandler()

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
	handler := newTestHandler()

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

func TestSanitizeEmail(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"  Test@Example.COM  ", "test@example.com"},
		{"user@domain.org", "user@domain.org"},
		{"USER@DOMAIN.COM", "user@domain.com"},
	}

	for _, tt := range tests {
		result := sanitizeEmail(tt.input)
		if result != tt.expected {
			t.Errorf("sanitizeEmail(%q) = %q, expected %q", tt.input, result, tt.expected)
		}
	}
}

func TestSanitizeString(t *testing.T) {
	tests := []struct {
		input    string
		maxLen   int
		expected string
	}{
		{"  hello  ", 100, "hello"},
		{"<script>alert('xss')</script>", 100, "scriptalert(xss)/script"},
		{"normal text", 5, "norma"},
	}

	for _, tt := range tests {
		result := sanitizeString(tt.input, tt.maxLen)
		if result != tt.expected {
			t.Errorf("sanitizeString(%q, %d) = %q, expected %q", tt.input, tt.maxLen, result, tt.expected)
		}
	}
}

func TestIsValidEmail(t *testing.T) {
	tests := []struct {
		email    string
		expected bool
	}{
		{"user@example.com", true},
		{"user.name@domain.org", true},
		{"user+tag@example.com", true},
		{"not-an-email", false},
		{"@nodomain.com", false},
		{"noat.com", false},
		{"", false},
	}

	for _, tt := range tests {
		result := isValidEmail(tt.email)
		if result != tt.expected {
			t.Errorf("isValidEmail(%q) = %v, expected %v", tt.email, result, tt.expected)
		}
	}
}

func TestIsValidPassword(t *testing.T) {
	tests := []struct {
		password string
		expected bool
	}{
		{"Password1", true},
		{"MySecure123", true},
		{"password", false},
		{"PASSWORD", false},
		{"Pass1", false},
		{"password123", false},
		{"PASSWORDABC", false},
		{"", false},
	}

	for _, tt := range tests {
		result := isValidPassword(tt.password)
		if result != tt.expected {
			t.Errorf("isValidPassword(%q) = %v, expected %v", tt.password, result, tt.expected)
		}
	}
}

func TestGenerateRefreshToken(t *testing.T) {
	handler := newTestHandler()

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
