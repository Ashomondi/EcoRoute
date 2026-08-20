package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"

	"ecoroute/backend/config"
	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/utils"
)

var (
	ErrEmailExists  = errors.New("email already registered")
	ErrInvalidLogin = errors.New("invalid email or password")
	ErrInvalidRole  = errors.New("invalid role")
	ErrValidation   = errors.New("invalid input")
)

type AuthService struct {
	users *repositories.UserRepository
	cfg   *config.Config
}

func NewAuthService(users *repositories.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{users: users, cfg: cfg}
}

type AuthResult struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

func (s *AuthService) Register(ctx context.Context, in models.RegisterInput) (*AuthResult, error) {
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if email == "" {
		return nil, fmt.Errorf("%w: email is required", ErrValidation)
	}
	if len(in.Password) < 6 {
		return nil, fmt.Errorf("%w: password must be at least 6 characters", ErrValidation)
	}

	role := in.Role
	if role == "" {
		role = models.RoleCommunity
	}
	if role != models.RoleCommunity && role != models.RoleDriver {
		return nil, ErrInvalidRole
	}

	existing, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, ErrEmailExists
	}

	hash, err := utils.HashPassword(in.Password)
	if err != nil {
		return nil, err
	}

	u := &models.User{Email: email, PasswordHash: hash, Role: role}
	if err := s.users.Create(ctx, u); err != nil {
		if isUniqueViolation(err) {
			return nil, ErrEmailExists
		}
		return nil, err
	}

	token, err := utils.GenerateToken(s.cfg.JWTSecret, s.cfg.JWTTTL, u.ID, string(u.Role))
	if err != nil {
		return nil, err
	}
	return &AuthResult{Token: token, User: u}, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*AuthResult, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || password == "" {
		return nil, fmt.Errorf("%w: email and password are required", ErrValidation)
	}

	u, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if u == nil || !utils.CheckPassword(u.PasswordHash, password) {
		return nil, ErrInvalidLogin
	}

	token, err := utils.GenerateToken(s.cfg.JWTSecret, s.cfg.JWTTTL, u.ID, string(u.Role))
	if err != nil {
		return nil, err
	}
	return &AuthResult{Token: token, User: u}, nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
