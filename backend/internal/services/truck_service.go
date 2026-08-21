package services

import (
	"context"
	"fmt"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
)

type TruckService struct {
	repo  *repositories.TruckRepository
	users *repositories.UserRepository
}

func NewTruckService(repo *repositories.TruckRepository, users *repositories.UserRepository) *TruckService {
	return &TruckService{repo: repo, users: users}
}

func (s *TruckService) List(ctx context.Context) ([]models.Truck, error) {
	return s.repo.List(ctx)
}

func (s *TruckService) GetByID(ctx context.Context, id string) (*models.Truck, error) {
	t, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if t == nil {
		return nil, ErrNotFound
	}
	return t, nil
}

func (s *TruckService) Create(ctx context.Context, in models.TruckInput) (*models.Truck, error) {
	status := in.Status
	if status == "" {
		status = models.TruckStatusIdle
	}
	if err := validateTruckInput(in.RegistrationNumber, in.CapacityKg, in.CurrentLat, in.CurrentLng, status); err != nil {
		return nil, err
	}
	if in.DriverID != nil {
		if err := s.validateDriver(ctx, *in.DriverID); err != nil {
			return nil, err
		}
		if err := s.repo.ClearDriver(ctx, *in.DriverID); err != nil {
			return nil, err
		}
	}

	t := &models.Truck{
		RegistrationNumber: in.RegistrationNumber,
		CapacityKg:         in.CapacityKg,
		DriverID:           in.DriverID,
		CurrentLat:         in.CurrentLat,
		CurrentLng:         in.CurrentLng,
		Status:             status,
	}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TruckService) Update(ctx context.Context, id string, in models.TruckInput) (*models.Truck, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrNotFound
	}

	status := in.Status
	if status == "" {
		status = existing.Status
	}
	if err := validateTruckInput(in.RegistrationNumber, in.CapacityKg, in.CurrentLat, in.CurrentLng, status); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, &models.Truck{
		ID:                 id,
		RegistrationNumber: in.RegistrationNumber,
		CapacityKg:         in.CapacityKg,
		DriverID:           existing.DriverID,
		CurrentLat:         in.CurrentLat,
		CurrentLng:         in.CurrentLng,
		Status:             status,
	})
}

func (s *TruckService) AssignDriver(ctx context.Context, truckID string, driverID *string) (*models.Truck, error) {
	if _, err := s.GetByID(ctx, truckID); err != nil {
		return nil, err
	}
	if driverID != nil {
		if err := s.validateDriver(ctx, *driverID); err != nil {
			return nil, err
		}
		if err := s.repo.ClearDriver(ctx, *driverID); err != nil {
			return nil, err
		}
	}
	return s.repo.SetDriver(ctx, truckID, driverID)
}

func (s *TruckService) Delete(ctx context.Context, id string) error {
	truck, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if truck == nil {
		return ErrNotFound
	}
	return s.repo.Delete(ctx, id)
}

func (s *TruckService) validateDriver(ctx context.Context, driverID string) error {
	u, err := s.users.GetByID(ctx, driverID)
	if err != nil {
		return err
	}
	if u == nil {
		return fmt.Errorf("%w: driver not found", ErrValidation)
	}
	if u.Role != models.RoleDriver {
		return fmt.Errorf("%w: user is not a driver", ErrValidation)
	}
	return nil
}

func validateTruckInput(reg string, capacity, lat, lng float64, status string) error {
	if reg == "" {
		return fmt.Errorf("%w: registration_number is required", ErrValidation)
	}
	if capacity <= 0 {
		return fmt.Errorf("%w: capacity_kg must be positive", ErrValidation)
	}
	if lat < -90 || lat > 90 {
		return fmt.Errorf("%w: latitude must be between -90 and 90", ErrValidation)
	}
	if lng < -180 || lng > 180 {
		return fmt.Errorf("%w: longitude must be between -180 and 180", ErrValidation)
	}
	switch status {
	case models.TruckStatusIdle, models.TruckStatusEnRoute, models.TruckStatusFull, models.TruckStatusMaintenance:
		return nil
	default:
		return fmt.Errorf("%w: invalid truck status", ErrValidation)
	}
}
