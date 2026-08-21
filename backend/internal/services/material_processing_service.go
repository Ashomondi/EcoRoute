package services

import (
	"context"
	"fmt"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
)

type MaterialProcessingService struct {
	repo    *repositories.MaterialProcessingRepository
	recycle *repositories.RecyclingRepository
}

func NewMaterialProcessingService(repo *repositories.MaterialProcessingRepository, recycle *repositories.RecyclingRepository) *MaterialProcessingService {
	return &MaterialProcessingService{repo: repo, recycle: recycle}
}

func (s *MaterialProcessingService) CreateBatch(ctx context.Context, in models.MaterialBatchInput) (*models.MaterialBatch, error) {
	if in.SourceType != models.MaterialSourceCollection && in.SourceType != models.MaterialSourceDropoff {
		return nil, fmt.Errorf("%w: source_type must be collection or dropoff", ErrValidation)
	}
	if in.SourceID == "" {
		return nil, fmt.Errorf("%w: source_id is required", ErrValidation)
	}
	if in.ReceivedKg <= 0 || in.ReceivedKg > 10000 {
		return nil, fmt.Errorf("%w: received_kg must be greater than 0 and at most 10000", ErrValidation)
	}
	wt, err := s.recycle.GetWasteType(ctx, in.Material)
	if err != nil {
		return nil, err
	}
	if wt == nil {
		return nil, fmt.Errorf("%w: unknown waste type", ErrValidation)
	}
	if !wt.Recyclable {
		return nil, fmt.Errorf("%w: %s cannot be processed at a recycling centre", ErrValidation, wt.Name)
	}

	b := &models.MaterialBatch{
		SourceType: in.SourceType,
		SourceID:   in.SourceID,
		Material:   in.Material,
		ReceivedKg: in.ReceivedKg,
		Status:     models.MaterialStatusReceived,
	}
	if err := s.repo.CreateBatch(ctx, b); err != nil {
		return nil, err
	}
	b.MaterialName = wt.Name
	return b, nil
}

func (s *MaterialProcessingService) ListBatches(ctx context.Context) ([]models.MaterialBatch, error) {
	return s.repo.ListBatches(ctx)
}

func (s *MaterialProcessingService) UpdateStatus(ctx context.Context, id, status string) (*models.MaterialBatch, error) {
	b, err := s.repo.GetBatch(ctx, id)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, ErrNotFound
	}

	switch status {
	case models.MaterialStatusReceived, models.MaterialStatusSorted,
		models.MaterialStatusProcessing, models.MaterialStatusRecycled, models.MaterialStatusSold:
	default:
		return nil, fmt.Errorf("%w: invalid processing status", ErrValidation)
	}

	if err := s.repo.UpdateStatus(ctx, id, status); err != nil {
		return nil, err
	}
	b.Status = status
	if status == models.MaterialStatusSorted {
		b.SortedKg = b.ReceivedKg
	}
	if status == models.MaterialStatusRecycled || status == models.MaterialStatusSold {
		b.RecycledKg = b.ReceivedKg
	}
	return b, nil
}

func (s *MaterialProcessingService) Summary(ctx context.Context) (*models.RecyclingCenterSummary, error) {
	return s.repo.Summary(ctx)
}
