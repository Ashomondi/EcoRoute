package services

import (
	"context"
	"errors"
	"fmt"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
)

var ErrForbidden = errors.New("forbidden")

type CollectionService struct {
	collection *repositories.CollectionRepository
	trucks     *repositories.TruckRepository
	waste      *repositories.WasteRepository
}

func NewCollectionService(collection *repositories.CollectionRepository, trucks *repositories.TruckRepository, waste *repositories.WasteRepository) *CollectionService {
	return &CollectionService{collection: collection, trucks: trucks, waste: waste}
}

func (s *CollectionService) ListForUser(ctx context.Context, userID, role string) ([]models.CollectionRecord, error) {
	switch role {
	case string(models.RoleAdmin):
		return s.collection.ListAll(ctx)
	case string(models.RoleDriver):
		truck, err := s.trucks.GetByDriver(ctx, userID)
		if err != nil {
			return nil, err
		}
		if truck == nil {
			return []models.CollectionRecord{}, nil
		}
		return s.collection.ListByTruck(ctx, truck.ID)
	default:
		return nil, ErrForbidden
	}
}

func (s *CollectionService) MarkCollected(ctx context.Context, userID, role, wastePointID, outcome, routeID string) (*models.CollectionRecord, error) {
	if outcome != models.OutcomeCollected && outcome != models.OutcomeFailed {
		return nil, fmt.Errorf("%w: outcome must be collected or failed", ErrValidation)
	}

	wp, err := s.waste.GetByID(ctx, wastePointID)
	if err != nil {
		return nil, err
	}
	if wp == nil {
		return nil, fmt.Errorf("%w: waste point not found", ErrValidation)
	}

	var truckID string
	switch role {
	case string(models.RoleAdmin):
		if routeID == "" {
			return nil, fmt.Errorf("%w: route_id is required for admin", ErrValidation)
		}
	case string(models.RoleDriver):
		truck, err := s.trucks.GetByDriver(ctx, userID)
		if err != nil {
			return nil, err
		}
		if truck == nil {
			return nil, fmt.Errorf("%w: no truck assigned to this driver", ErrValidation)
		}
		truckID = truck.ID
		if routeID == "" {
			routeID, err = s.collection.GetActiveRouteID(ctx, truckID)
			if err != nil {
				return nil, err
			}
			if routeID == "" {
				return nil, fmt.Errorf("%w: no active route for the assigned truck", ErrValidation)
			}
		}
	default:
		return nil, ErrForbidden
	}

	routeTruck, err := s.collection.GetRouteTruck(ctx, routeID)
	if err != nil {
		return nil, err
	}
	if routeTruck == "" {
		return nil, ErrNotFound
	}
	if truckID != "" && routeTruck != truckID {
		return nil, fmt.Errorf("%w: route does not belong to the assigned truck", ErrValidation)
	}
	truckID = routeTruck

	member, err := s.collection.RouteContainsPoint(ctx, routeID, wastePointID)
	if err != nil {
		return nil, err
	}
	if !member {
		return nil, fmt.Errorf("%w: waste point is not on this route", ErrValidation)
	}

	rec := &models.CollectionRecord{
		RouteID:      routeID,
		WastePointID: wastePointID,
		TruckID:      truckID,
		Outcome:      outcome,
		EstimatedKg:  kgPerLevelPct * float64(wp.CurrentLevelPct),
	}
	if err := s.collection.Create(ctx, rec); err != nil {
		return nil, err
	}

	if outcome == models.OutcomeCollected {
		if err := s.waste.ResetCollected(ctx, wastePointID); err != nil {
			return nil, err
		}
	}
	return rec, nil
}
