package services

import (
	"context"
	"fmt"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
)

type ReportService struct {
	repo  *repositories.ReportRepository
	waste *repositories.WasteRepository
}

func NewReportService(repo *repositories.ReportRepository, waste *repositories.WasteRepository) *ReportService {
	return &ReportService{repo: repo, waste: waste}
}

func (s *ReportService) CreateReport(ctx context.Context, userID string, in models.ReportInput) (*models.WasteReport, error) {
	switch in.ProblemType {
	case models.ProblemOverflow, models.ProblemIllegalDumping, models.ProblemMissedCollection, models.ProblemOther:
	default:
		return nil, fmt.Errorf("%w: problem_type is required", ErrValidation)
	}

	if in.WastePointID != nil {
		wp, err := s.waste.GetByID(ctx, *in.WastePointID)
		if err != nil {
			return nil, err
		}
		if wp == nil {
			return nil, fmt.Errorf("%w: waste point not found", ErrValidation)
		}
	}

	rep := &models.WasteReport{
		WastePointID: in.WastePointID,
		ReportedBy:   userID,
		ProblemType:  in.ProblemType,
		Description:  in.Description,
		PhotoURL:     in.PhotoURL,
		Priority:     priorityFor(in.ProblemType),
		Status:       models.ReportStatusOpen,
	}
	if err := s.repo.Create(ctx, rep); err != nil {
		return nil, err
	}

	if in.WastePointID != nil {
		if err := s.waste.EscalatePriority(ctx, *in.WastePointID); err != nil {
			return nil, err
		}
	}
	return rep, nil
}

func (s *ReportService) List(ctx context.Context, status string) ([]models.WasteReport, error) {
	if status != "" {
		switch status {
		case models.ReportStatusOpen, models.ReportStatusInProgress, models.ReportStatusResolved:
		default:
			return nil, fmt.Errorf("%w: invalid status filter", ErrValidation)
		}
	}
	return s.repo.List(ctx, status)
}

func (s *ReportService) ListForUser(ctx context.Context, userID string) ([]models.WasteReport, error) {
	return s.repo.ListByUser(ctx, userID)
}

func priorityFor(problemType string) string {
	switch problemType {
	case models.ProblemOverflow, models.ProblemMissedCollection:
		return models.ReportPriorityHigh
	default:
		return models.ReportPriorityMedium
	}
}
