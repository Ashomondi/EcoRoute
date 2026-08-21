package services

import (
	"context"
	"fmt"
	"sort"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/utils"
)

const maxRecycleKg = 1000.0

type RecyclingService struct {
	repo *repositories.RecyclingRepository
}

func NewRecyclingService(repo *repositories.RecyclingRepository) *RecyclingService {
	return &RecyclingService{repo: repo}
}

func (s *RecyclingService) WasteTypes(ctx context.Context) ([]models.WasteType, error) {
	return s.repo.ListWasteTypes(ctx)
}

func (s *RecyclingService) Recyclers(ctx context.Context, lat, lng *float64, radiusKm *float64, wasteType string) ([]models.Recycler, error) {
	recyclers, err := s.repo.ListRecyclers(ctx)
	if err != nil {
		return nil, err
	}

	if lat == nil || lng == nil {
		return recyclers, nil
	}

	type withDist struct {
		recycler models.Recycler
		dist     float64
	}
	items := make([]withDist, 0, len(recyclers))
	for _, rc := range recyclers {
		d := utils.HaversineKm(*lat, *lng, rc.Latitude, rc.Longitude)
		if radiusKm != nil && d > *radiusKm {
			continue
		}
		rc.DistanceKm = &d
		if wasteType != "" {
			accepts := false
			for _, t := range rc.AcceptedTypes {
				if t == wasteType {
					accepts = true
					break
				}
			}
			rc.AcceptsType = &accepts
		}
		items = append(items, withDist{recycler: rc, dist: d})
	}

	sort.Slice(items, func(i, j int) bool { return items[i].dist < items[j].dist })
	out := make([]models.Recycler, len(items))
	for i, it := range items {
		out[i] = it.recycler
	}
	return out, nil
}

func (s *RecyclingService) CreateRecycler(ctx context.Context, in models.RecyclerInput) (*models.Recycler, error) {
	if err := validateRecyclerInput(in); err != nil {
		return nil, err
	}
	status := in.Status
	if status == "" {
		status = models.RecyclerStatusActive
	}

	rc := &models.Recycler{
		Name:          in.Name,
		Address:       in.Address,
		Phone:         in.Phone,
		Website:       in.Website,
		Latitude:      in.Latitude,
		Longitude:     in.Longitude,
		AcceptedTypes: in.AcceptedTypes,
		Status:        status,
	}
	if err := s.repo.CreateRecycler(ctx, rc); err != nil {
		return nil, err
	}
	return rc, nil
}

func (s *RecyclingService) UpdateRecycler(ctx context.Context, id string, in models.RecyclerInput) (*models.Recycler, error) {
	existing, err := s.repo.GetRecycler(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrNotFound
	}

	if err := validateRecyclerInput(in); err != nil {
		return nil, err
	}
	status := in.Status
	if status == "" {
		status = existing.Status
	}

	rc := &models.Recycler{
		ID:            id,
		Name:          in.Name,
		Address:       in.Address,
		Phone:         in.Phone,
		Website:       in.Website,
		Latitude:      in.Latitude,
		Longitude:     in.Longitude,
		AcceptedTypes: in.AcceptedTypes,
		Status:        status,
	}
	if err := s.repo.UpdateRecycler(ctx, rc); err != nil {
		return nil, err
	}
	rc.CreatedAt = existing.CreatedAt
	return rc, nil
}

func (s *RecyclingService) DeleteRecycler(ctx context.Context, id string) error {
	existing, err := s.repo.GetRecycler(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrNotFound
	}
	return s.repo.DeleteRecycler(ctx, id)
}

func (s *RecyclingService) CreateRecord(ctx context.Context, userID string, in models.RecycleInput) (*models.RecyclingRecord, error) {
	wt, err := s.repo.GetWasteType(ctx, in.WasteType)
	if err != nil {
		return nil, err
	}
	if wt == nil {
		return nil, fmt.Errorf("%w: unknown waste type", ErrValidation)
	}
	if !wt.Recyclable {
		return nil, fmt.Errorf("%w: %s must be taken to a dedicated drop-off, not recycled", ErrValidation, wt.Name)
	}
	if in.EstimatedKg <= 0 || in.EstimatedKg > maxRecycleKg {
		return nil, fmt.Errorf("%w: estimated_kg must be greater than 0 and at most %v", ErrValidation, maxRecycleKg)
	}
	if in.RecyclerID != nil && *in.RecyclerID != "" {
		rc, err := s.repo.GetRecycler(ctx, *in.RecyclerID)
		if err != nil {
			return nil, err
		}
		if rc == nil {
			return nil, fmt.Errorf("%w: recycler not found", ErrValidation)
		}
	}

	rec := &models.RecyclingRecord{
		UserID:      userID,
		WasteType:   in.WasteType,
		EstimatedKg: in.EstimatedKg,
		RecyclerID:  in.RecyclerID,
		PhotoURL:    in.PhotoURL,
	}
	if err := s.repo.CreateRecord(ctx, rec); err != nil {
		return nil, err
	}
	rec.WasteName = wt.Name
	return rec, nil
}

func (s *RecyclingService) Records(ctx context.Context) ([]models.RecyclingRecord, error) {
	return s.repo.ListRecords(ctx)
}

func (s *RecyclingService) RecordsForUser(ctx context.Context, userID string) ([]models.RecyclingRecord, error) {
	return s.repo.ListRecordsByUser(ctx, userID)
}

func (s *RecyclingService) ImpactForUser(ctx context.Context, userID string) (*models.RecyclingImpact, error) {
	return s.impact(ctx, &userID)
}

func (s *RecyclingService) ImpactTotal(ctx context.Context) (*models.RecyclingImpact, error) {
	return s.impact(ctx, nil)
}

func (s *RecyclingService) impact(ctx context.Context, userID *string) (*models.RecyclingImpact, error) {
	byType, err := s.repo.ImpactByType(ctx, userID)
	if err != nil {
		return nil, err
	}

	total := &models.RecyclingImpact{}
	for _, ti := range byType {
		total.TotalKg += ti.Kg
		total.ItemsRecycled += ti.Count
		total.CO2SavedKg += ti.CO2SavedKg
		total.EnergySavedKwh += ti.EnergySavedKwh
	}
	total.LandfillDivertedKg = total.TotalKg
	total.ByType = byType
	return total, nil
}

func validateRecyclerInput(in models.RecyclerInput) error {
	if in.Name == "" {
		return fmt.Errorf("%w: name is required", ErrValidation)
	}
	if in.Latitude < -90 || in.Latitude > 90 {
		return fmt.Errorf("%w: latitude must be between -90 and 90", ErrValidation)
	}
	if in.Longitude < -180 || in.Longitude > 180 {
		return fmt.Errorf("%w: longitude must be between -180 and 180", ErrValidation)
	}
	if in.Status != "" && in.Status != models.RecyclerStatusActive && in.Status != models.RecyclerStatusInactive {
		return fmt.Errorf("%w: status must be active or inactive", ErrValidation)
	}
	return nil
}
