package models

import "time"

type Role string

const (
	RoleAdmin     Role = "admin"
	RoleDriver    Role = "driver"
	RoleCommunity Role = "community"
)

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

type RegisterInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     Role   `json:"role"`
}
