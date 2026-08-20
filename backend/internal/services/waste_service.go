package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"
	"time"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
)

var ErrNotFound = errors.New("not found")

func StatusForLevel(pct int) string {
	switch {
	case pct >= 85:
		return models.StatusCritical
	case pct >= 60:
		return models.StatusWarning
	default:
		return models.StatusOK
	}
}

type WasteService struct {
	repo *repositories.WasteRepository
	ai   *AIClient
}

func NewWasteService(repo *repositories.WasteRepository, ai *AIClient) *WasteService {
	return &WasteService{repo: repo, ai: ai}
}

func (s *WasteService) List(ctx context.Context) ([]models.WastePoint, error) {
	return s.repo.List(ctx)
}

func (s *WasteService) GetByID(ctx context.Context, id string) (*models.WastePoint, error) {
	wp, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if wp == nil {
		return nil, ErrNotFound
	}
	return wp, nil
}

func (s *WasteService) GetByIDWithPrediction(ctx context.Context, id string) (*models.WastePoint, error) {
	wp, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s.ai == nil {
		return wp, nil
	}

	days := 30
	if wp.LastCollectedAt != nil {
		days = int(time.Since(*wp.LastCollectedAt).Hours() / 24)
		if days < 0 {
			days = 0
		}
	}

	pred, err := s.ai.Predict(ctx, AIPredictionRequest{
		WastePointID:            wp.ID,
		CurrentLevelPct:         wp.CurrentLevelPct,
		DaysSinceLastCollection: days,
	})
	if err != nil {
		log.Printf("ai prediction unavailable for %s: %v", id, err)
		return wp, nil
	}

	wp.Prediction = &models.AIPrediction{
		PredictedLevelTomorrow: int(math.Round(pred.PredictedLevelTomorrow)),
		RecommendCollect:       pred.RecommendCollect,
	}
	return wp, nil
}

func (s *WasteService) Create(ctx context.Context, in models.WastePointInput) (*models.WastePoint, error) {
	level := 0
	if in.CurrentLevelPct != nil {
		level = *in.CurrentLevelPct
	}
	if err := validateWastePointInput(in.Name, in.Latitude, in.Longitude, level); err != nil {
		return nil, err
	}

	wp := &models.WastePoint{
		Name:            in.Name,
		Latitude:        in.Latitude,
		Longitude:       in.Longitude,
		CurrentLevelPct: level,
		Status:          StatusForLevel(level),
	}
	if err := s.repo.Create(ctx, wp); err != nil {
		return nil, err
	}
	return wp, nil
}

func (s *WasteService) Update(ctx context.Context, id string, in models.WastePointInput) (*models.WastePoint, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrNotFound
	}

	level := existing.CurrentLevelPct
	if in.CurrentLevelPct != nil {
		level = *in.CurrentLevelPct
	}
	if err := validateWastePointInput(in.Name, in.Latitude, in.Longitude, level); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, &models.WastePoint{
		ID:              id,
		Name:            in.Name,
		Latitude:        in.Latitude,
		Longitude:       in.Longitude,
		CurrentLevelPct: level,
		Status:          StatusForLevel(level),
	})
}

func validateWastePointInput(name string, lat, lng float64, level int) error {
	if name == "" {
		return fmt.Errorf("%w: name is required", ErrValidation)
	}
	if lat < -90 || lat > 90 {
		return fmt.Errorf("%w: latitude must be between -90 and 90", ErrValidation)
	}
	if lng < -180 || lng > 180 {
		return fmt.Errorf("%w: longitude must be between -180 and 180", ErrValidation)
	}
	if level < 0 || level > 100 {
		return fmt.Errorf("%w: current_level_pct must be between 0 and 100", ErrValidation)
	}
	return nil
}
