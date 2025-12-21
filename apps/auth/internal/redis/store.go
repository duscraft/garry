package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type TokenStore struct {
	client *redis.Client
}

func NewTokenStore(redisURL string) (*TokenStore, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid redis URL: %w", err)
	}

	client := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	return &TokenStore{client: client}, nil
}

func (s *TokenStore) Close() error {
	return s.client.Close()
}

func (s *TokenStore) Ping(ctx context.Context) error {
	return s.client.Ping(ctx).Err()
}

func (s *TokenStore) StoreRefreshToken(ctx context.Context, userID uuid.UUID, token string, expiry time.Duration) error {
	key := fmt.Sprintf("refresh_token:%s", token)
	return s.client.Set(ctx, key, userID.String(), expiry).Err()
}

func (s *TokenStore) GetRefreshToken(ctx context.Context, token string) (uuid.UUID, error) {
	key := fmt.Sprintf("refresh_token:%s", token)
	userIDStr, err := s.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return uuid.Nil, fmt.Errorf("token not found or expired")
	}
	if err != nil {
		return uuid.Nil, err
	}

	return uuid.Parse(userIDStr)
}

func (s *TokenStore) DeleteRefreshToken(ctx context.Context, token string) error {
	key := fmt.Sprintf("refresh_token:%s", token)
	return s.client.Del(ctx, key).Err()
}

func (s *TokenStore) DeleteAllUserRefreshTokens(ctx context.Context, userID uuid.UUID) error {
	pattern := fmt.Sprintf("refresh_token:*")
	var cursor uint64
	for {
		keys, nextCursor, err := s.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return err
		}

		for _, key := range keys {
			storedUserID, err := s.client.Get(ctx, key).Result()
			if err != nil {
				continue
			}
			if storedUserID == userID.String() {
				s.client.Del(ctx, key)
			}
		}

		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}
	return nil
}

func (s *TokenStore) StorePasswordResetToken(ctx context.Context, email, token string, expiry time.Duration) error {
	key := fmt.Sprintf("password_reset:%s", token)
	return s.client.Set(ctx, key, email, expiry).Err()
}

func (s *TokenStore) GetPasswordResetToken(ctx context.Context, token string) (string, error) {
	key := fmt.Sprintf("password_reset:%s", token)
	email, err := s.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("token not found or expired")
	}
	return email, err
}

func (s *TokenStore) DeletePasswordResetToken(ctx context.Context, token string) error {
	key := fmt.Sprintf("password_reset:%s", token)
	return s.client.Del(ctx, key).Err()
}

func (s *TokenStore) StoreEmailVerificationToken(ctx context.Context, email, token string, expiry time.Duration) error {
	key := fmt.Sprintf("email_verify:%s", token)
	return s.client.Set(ctx, key, email, expiry).Err()
}

func (s *TokenStore) GetEmailVerificationToken(ctx context.Context, token string) (string, error) {
	key := fmt.Sprintf("email_verify:%s", token)
	email, err := s.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("token not found or expired")
	}
	return email, err
}

func (s *TokenStore) DeleteEmailVerificationToken(ctx context.Context, token string) error {
	key := fmt.Sprintf("email_verify:%s", token)
	return s.client.Del(ctx, key).Err()
}

type SessionData struct {
	UserID    string `json:"user_id"`
	UserAgent string `json:"user_agent"`
	IPAddress string `json:"ip_address"`
	CreatedAt int64  `json:"created_at"`
	ExpiresAt int64  `json:"expires_at"`
}

func (s *TokenStore) StoreSession(ctx context.Context, userID uuid.UUID, sessionID, userAgent, ipAddress string, expiry time.Duration) error {
	sessionKey := fmt.Sprintf("session:%s", sessionID)
	userSessionsKey := fmt.Sprintf("user_sessions:%s", userID.String())

	data := SessionData{
		UserID:    userID.String(),
		UserAgent: userAgent,
		IPAddress: ipAddress,
		CreatedAt: time.Now().Unix(),
		ExpiresAt: time.Now().Add(expiry).Unix(),
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	pipe := s.client.Pipeline()
	pipe.Set(ctx, sessionKey, jsonData, expiry)
	pipe.SAdd(ctx, userSessionsKey, sessionID)
	pipe.Expire(ctx, userSessionsKey, expiry)

	_, err = pipe.Exec(ctx)
	return err
}

func (s *TokenStore) GetSession(ctx context.Context, sessionID string) (*SessionData, error) {
	key := fmt.Sprintf("session:%s", sessionID)
	data, err := s.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("session not found or expired")
	}
	if err != nil {
		return nil, err
	}

	var session SessionData
	if err := json.Unmarshal([]byte(data), &session); err != nil {
		return nil, err
	}

	return &session, nil
}

func (s *TokenStore) GetUserSessions(ctx context.Context, userID uuid.UUID) (map[string]*SessionData, error) {
	userSessionsKey := fmt.Sprintf("user_sessions:%s", userID.String())
	sessionIDs, err := s.client.SMembers(ctx, userSessionsKey).Result()
	if err != nil {
		return nil, err
	}

	sessions := make(map[string]*SessionData)
	for _, sessionID := range sessionIDs {
		session, err := s.GetSession(ctx, sessionID)
		if err != nil {
			s.client.SRem(ctx, userSessionsKey, sessionID)
			continue
		}
		sessions[sessionID] = session
	}

	return sessions, nil
}

func (s *TokenStore) DeleteSession(ctx context.Context, userID uuid.UUID, sessionID string) error {
	sessionKey := fmt.Sprintf("session:%s", sessionID)
	userSessionsKey := fmt.Sprintf("user_sessions:%s", userID.String())

	pipe := s.client.Pipeline()
	pipe.Del(ctx, sessionKey)
	pipe.SRem(ctx, userSessionsKey, sessionID)

	_, err := pipe.Exec(ctx)
	return err
}

func (s *TokenStore) DeleteAllUserSessions(ctx context.Context, userID uuid.UUID) error {
	userSessionsKey := fmt.Sprintf("user_sessions:%s", userID.String())
	sessionIDs, err := s.client.SMembers(ctx, userSessionsKey).Result()
	if err != nil {
		return err
	}

	if len(sessionIDs) == 0 {
		return nil
	}

	pipe := s.client.Pipeline()
	for _, sessionID := range sessionIDs {
		pipe.Del(ctx, fmt.Sprintf("session:%s", sessionID))
	}
	pipe.Del(ctx, userSessionsKey)

	_, err = pipe.Exec(ctx)
	return err
}
