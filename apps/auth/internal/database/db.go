package database

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	pool *pgxpool.Pool
}

func New(databaseURL string) (*DB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}

	return &DB{pool: pool}, nil
}

func (db *DB) Close() {
	db.pool.Close()
}

func (db *DB) Ping(ctx context.Context) error {
	return db.pool.Ping(ctx)
}

type User struct {
	ID                     uuid.UUID
	Email                  string
	PasswordHash           string
	Name                   string
	EmailVerified          bool
	EmailVerificationToken *string
	PasswordResetToken     *string
	PasswordResetExpires   *time.Time
	CreatedAt              time.Time
	UpdatedAt              time.Time
}

func (db *DB) CreateUser(ctx context.Context, email, passwordHash, name string) (*User, error) {
	verificationToken := uuid.New().String()

	var user User
	err := db.pool.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name, email_verification_token)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, email, password_hash, name, email_verified, email_verification_token, 
		           password_reset_token, password_reset_expires, created_at, updated_at`,
		email, passwordHash, name, verificationToken,
	).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.EmailVerified,
		&user.EmailVerificationToken, &user.PasswordResetToken, &user.PasswordResetExpires,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (db *DB) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := db.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, name, email_verified, email_verification_token,
		        password_reset_token, password_reset_expires, created_at, updated_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.EmailVerified,
		&user.EmailVerificationToken, &user.PasswordResetToken, &user.PasswordResetExpires,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (db *DB) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	var user User
	err := db.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, name, email_verified, email_verification_token,
		        password_reset_token, password_reset_expires, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.EmailVerified,
		&user.EmailVerificationToken, &user.PasswordResetToken, &user.PasswordResetExpires,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (db *DB) VerifyEmail(ctx context.Context, token string) error {
	_, err := db.pool.Exec(ctx,
		`UPDATE users SET email_verified = true, email_verification_token = NULL, updated_at = NOW()
		 WHERE email_verification_token = $1`,
		token,
	)
	return err
}

func (db *DB) SetPasswordResetToken(ctx context.Context, email string) (string, error) {
	token := uuid.New().String()
	expires := time.Now().Add(1 * time.Hour)

	_, err := db.pool.Exec(ctx,
		`UPDATE users SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
		 WHERE email = $3`,
		token, expires, email,
	)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (db *DB) ResetPassword(ctx context.Context, token, passwordHash string) error {
	result, err := db.pool.Exec(ctx,
		`UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW()
		 WHERE password_reset_token = $2 AND password_reset_expires > NOW()`,
		passwordHash, token,
	)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return ErrInvalidToken
	}

	return nil
}

func (db *DB) ResetPasswordByEmail(ctx context.Context, email, passwordHash string) error {
	result, err := db.pool.Exec(ctx,
		`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2`,
		passwordHash, email,
	)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return ErrInvalidToken
	}

	return nil
}

func (db *DB) StoreRefreshToken(ctx context.Context, userID uuid.UUID, token string, expiresAt time.Time) error {
	_, err := db.pool.Exec(ctx,
		`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
		userID, token, expiresAt,
	)
	return err
}

func (db *DB) GetRefreshToken(ctx context.Context, token string) (uuid.UUID, error) {
	var userID uuid.UUID
	err := db.pool.QueryRow(ctx,
		`SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`,
		token,
	).Scan(&userID)
	if err != nil {
		return uuid.Nil, err
	}
	return userID, nil
}

func (db *DB) DeleteRefreshToken(ctx context.Context, token string) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM refresh_tokens WHERE token = $1`, token)
	return err
}

func (db *DB) DeleteAllUserRefreshTokens(ctx context.Context, userID uuid.UUID) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM refresh_tokens WHERE user_id = $1`, userID)
	return err
}

var ErrInvalidToken = &DBError{Message: "invalid or expired token"}

type DBError struct {
	Message string
}

func (e *DBError) Error() string {
	return e.Message
}
