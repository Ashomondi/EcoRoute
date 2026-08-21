package services

import (
	"context"
	"fmt"
	"math"
	"time"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/utils"
)

var urgencyByType = map[string]float64{
	"hazardous": 25,
	"e_waste":   20,
	"organic":   18,
	"plastic":   15,
	"metal":     12,
	"paper":     8,
	"glass":     6,
	"textile":   4,
}

type CollectionRequestService struct {
	repo  *repositories.CollectionRequestRepository
	trucks *repositories.TruckRepository
}

func NewCollectionRequestService(repo *repositories.CollectionRequestRepository, trucks *repositories.TruckRepository) *CollectionRequestService {
	return &CollectionRequestService{repo: repo, trucks: trucks}
}

func (s *CollectionRequestService) Create(ctx context.Context, userID string, in models.CollectionRequestInput) (*models.CollectionRequest, error) {
	if err := validateCollectionRequestInput(in); err != nil {
		return nil, err
	}

	req := &models.CollectionRequest{
		RequesterID:   userID,
		RequesterType: in.RequesterType,
		WasteType:     in.WasteType,
		EstimatedKg:   in.EstimatedKg,
		Latitude:      in.Latitude,
		Longitude:     in.Longitude,
		Address:       in.Address,
		Notes:         in.Notes,
		Status:        models.RequestStatusPending,
	}
	if err := s.repo.Create(ctx, req); err != nil {
		return nil, err
	}
	score, breakdown := s.computeScore(req, nil)
	req.PriorityScore = score
	req.ScoreBreakdown = breakdown
	if err := s.repo.UpdateScore(ctx, req.ID, score); err != nil {
		return nil, err
	}
	created, err := s.repo.GetByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	created.ScoreBreakdown = breakdown
	return created, nil
}

func (s *CollectionRequestService) List(ctx context.Context, status string) ([]models.CollectionRequest, error) {
	return s.repo.List(ctx, status)
}

func (s *CollectionRequestService) ListForUser(ctx context.Context, userID string) ([]models.CollectionRequest, error) {
	return s.repo.ListByUser(ctx, userID)
}

// Prioritize recomputes the smart-priority score for every open request and
// returns them ranked. Scores blend material urgency, estimated demand, how
// long the waste has waited, the requester type and proximity to the fleet.
func (s *CollectionRequestService) Prioritize(ctx context.Context) ([]models.CollectionRequest, error) {
	requests, err := s.repo.ListActive(ctx)
	if err != nil {
		return nil, err
	}

	trucks, err := s.trucks.List(ctx)
	if err != nil {
		return nil, err
	}

	for i := range requests {
		score, breakdown := s.computeScore(&requests[i], trucks)
		requests[i].PriorityScore = score
		requests[i].ScoreBreakdown = breakdown
		if err := s.repo.UpdateScore(ctx, requests[i].ID, score); err != nil {
			return nil, err
		}
	}

	// Re-fetch so the response reflects persisted order deterministically.
	active, err := s.repo.ListActive(ctx)
	if err != nil {
		return nil, err
	}
	ranked := map[string]*models.ScoreBreakdown{}
	for i := range requests {
		ranked[requests[i].ID] = requests[i].ScoreBreakdown
	}
	for i := range active {
		active[i].ScoreBreakdown = ranked[active[i].ID]
	}
	return active, nil
}

func (s *CollectionRequestService) UpdateStatus(ctx context.Context, id string, in models.CollectionRequestStatusInput) (*models.CollectionRequest, error) {
	req, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req == nil {
		return nil, ErrNotFound
	}

	var collectedAt *time.Time
	switch in.Status {
	case models.RequestStatusPending, models.RequestStatusScheduled:
	case models.RequestStatusCollected:
		now := time.Now()
		collectedAt = &now
	case models.RequestStatusCancelled:
	default:
		return nil, fmt.Errorf("%w: invalid request status", ErrValidation)
	}

	if err := s.repo.UpdateStatus(ctx, id, in.Status, req.RouteID, collectedAt); err != nil {
		return nil, err
	}
	req.Status = in.Status
	req.CollectedAt = collectedAt
	return req, nil
}

func (s *CollectionRequestService) computeScore(req *models.CollectionRequest, trucks []models.Truck) (float64, *models.ScoreBreakdown) {
	urgency, ok := urgencyByType[req.WasteType]
	if !ok {
		urgency = 10
	}

	demand := math.Min(20, req.EstimatedKg/10)

	ageHours := time.Since(req.CreatedAt).Hours()
	age := math.Min(20, ageHours/3)

	requester := 5.0
	if req.RequesterType == models.RequestTypeBusiness {
		requester = 10
	}

	proximity := 0.0
	if len(trucks) > 0 {
		best := math.Inf(1)
		for _, t := range trucks {
			d := utils.HaversineKm(req.Latitude, req.Longitude, t.CurrentLat, t.CurrentLng)
			if d < best {
				best = d
			}
		}
		switch {
		case best <= 1:
			proximity = 25
		case best <= 3:
			proximity = 15
		case best <= 5:
			proximity = 8
		}
	}

	breakdown := &models.ScoreBreakdown{
		Urgency:   urgency,
		Demand:    demand,
		Age:       age,
		Requester: requester,
		Proximity: proximity,
	}
	return urgency + demand + age + requester + proximity, breakdown
}

func validateCollectionRequestInput(in models.CollectionRequestInput) error {
	if in.RequesterType != models.RequestTypeHousehold && in.RequesterType != models.RequestTypeBusiness {
		return fmt.Errorf("%w: requester_type must be household or business", ErrValidation)
	}
	if in.WasteType == "" {
		return fmt.Errorf("%w: waste_type is required", ErrValidation)
	}
	if in.EstimatedKg <= 0 || in.EstimatedKg > 5000 {
		return fmt.Errorf("%w: estimated_kg must be greater than 0 and at most 5000", ErrValidation)
	}
	if in.Latitude < -90 || in.Latitude > 90 {
		return fmt.Errorf("%w: latitude must be between -90 and 90", ErrValidation)
	}
	if in.Longitude < -180 || in.Longitude > 180 {
		return fmt.Errorf("%w: longitude must be between -180 and 180", ErrValidation)
	}
	return nil
}
