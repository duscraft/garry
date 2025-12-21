package redis

import (
	"context"
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
