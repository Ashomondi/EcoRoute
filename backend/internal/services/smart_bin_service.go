package services

import (
	"context"
	"fmt"
	"hash/fnv"
	"log"
	"sort"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
)

var commonCategories = []string{"plastic", "paper", "organic", "glass", "metal", "textile"}

type SmartBinService struct {
	bins    *repositories.SmartBinRepository
	waste   *repositories.WasteRepository
	recycle *repositories.RecyclingRepository
	ai      *AIClient
}

func NewSmartBinService(bins *repositories.SmartBinRepository, waste *repositories.WasteRepository, recycle *repositories.RecyclingRepository, ai *AIClient) *SmartBinService {
	return &SmartBinService{bins: bins, waste: waste, recycle: recycle, ai: ai}
}

func (s *SmartBinService) ReadBin(ctx context.Context, binID, trigger string) (*models.SmartBinReading, error) {
	if trigger == "" {
		trigger = models.ReadTriggerManual
	}
	switch trigger {
	case models.ReadTriggerManual, models.ReadTriggerFull, models.ReadTriggerScheduled:
	default:
		return nil, fmt.Errorf("%w: trigger must be manual, full or scheduled", ErrValidation)
	}

	wp, err := s.waste.GetByID(ctx, binID)
	if err != nil {
		return nil, err
	}
	if wp == nil {
		return nil, ErrNotFound
	}
	category := wp.Category
	if category == "" {
		category = "other"
	}
	if !containsStr(commonCategories, category) && category != "other" {
		category = "other"
	}

	var result *AIClassifyResult
	if s.ai != nil {
		res, err := s.ai.Classify(ctx, AIClassifyRequest{
			WastePointID:    binID,
			CurrentLevelPct: wp.CurrentLevelPct,
			MaxCapacityKg:   wp.MaxCapacityKg,
			Category:        category,
		})
		if err == nil {
			result = res
		} else {
			log.Printf("ai classify unavailable for %s: %v", binID, err)
		}
	}
	if result == nil {
		result = classifyFallback(binID, wp.CurrentLevelPct, wp.MaxCapacityKg, category)
	}

	reading := &models.SmartBinReading{
		WastePointID:    binID,
		Category:        category,
		TotalKg:         result.TotalKg,
		Composition:     result.Composition,
		PrimaryCategory: result.PrimaryCategory,
		Confidence:      result.Confidence,
		TriggerType:     trigger,
		Status:          models.ReadingStatusPending,
	}
	if err := s.bins.CreateReading(ctx, reading); err != nil {
		return nil, err
	}
	if err := s.bins.SetBinEstimate(ctx, binID, reading.TotalKg); err != nil {
		return nil, err
	}

	wt, _ := s.recycle.GetWasteType(ctx, category)
	if wt != nil {
		reading.CategoryName = wt.Name
	}
	reading.WastePointName = wp.Name
	return reading, nil
}

func (s *SmartBinService) ListBinReadings(ctx context.Context, binID string) ([]models.SmartBinReading, error) {
	return s.bins.ListBinReadings(ctx, binID)
}

func (s *SmartBinService) ListReadings(ctx context.Context) ([]models.SmartBinReading, error) {
	return s.bins.ListReadings(ctx)
}

func (s *SmartBinService) Analytics(ctx context.Context) (*models.SmartBinAnalytics, error) {
	a, err := s.bins.Analytics(ctx)
	if err != nil {
		return nil, err
	}
	names := map[string]string{}
	types, err := s.recycle.ListWasteTypes(ctx)
	if err == nil {
		for _, t := range types {
			names[t.Slug] = t.Name
		}
	}
	sort.Slice(a.Composition, func(i, j int) bool { return a.Composition[i].Kg > a.Composition[j].Kg })
	for i := range a.Composition {
		a.Composition[i].CategoryName = names[a.Composition[i].Category]
	}
	return a, nil
}

func (s *SmartBinService) ResolveOnCollection(ctx context.Context, binID, collectionID string) error {
	return s.bins.ResolveOnCollection(ctx, binID, collectionID)
}

// classifyFallback mirrors the AI service's deterministic classifier so the
// feature degrades gracefully when the AI container is down.
func classifyFallback(binID string, levelPct int, capacityKg float64, category string) *AIClassifyResult {
	fill := clamp(float64(levelPct)/100.0, 0, 1)
	if capacityKg <= 0 {
		capacityKg = 200
	}
	h := fnv.New32a()
	_, _ = h.Write([]byte(binID))
	seed := int64(h.Sum32())

	jitter := float64(seed%80) / 1000.0 // 0.000..0.079
	total := round1(capacityKg * fill * (0.78 + jitter))
	if total <= 0 {
		return &AIClassifyResult{TotalKg: 0, Composition: map[string]float64{}, PrimaryCategory: category, Confidence: 0}
	}

	primary := category
	if !containsStr(commonCategories, primary) {
		primary = "other"
	}
	share := 0.82 + float64(seed%13-6)/100.0
	comp := map[string]float64{}
	comp[primary] = round1(total * share)

	others := []string{}
	for _, c := range commonCategories {
		if c != primary {
			others = append(others, c)
		}
	}
	if len(others) > 3 {
		others = others[:3]
	}
	remaining := total - comp[primary]
	weights := make([]float64, len(others))
	totalW := 0.0
	for i := range others {
		w := float64((seed*int64(i+3))%80)/100.0 + 0.2
		weights[i] = w
		totalW += w
	}
	assigned := 0.0
	for i, o := range others {
		part := round1(remaining * weights[i] / totalW)
		comp[o] = part
		assigned += part
	}
	if len(others) > 0 {
		last := others[len(others)-1]
		comp[last] = round1(comp[last] + (remaining - assigned))
	}
	sum := 0.0
	for _, v := range comp {
		sum += v
	}
	if sum != total {
		comp[primary] = round1(comp[primary] + (total - sum))
	}
	return &AIClassifyResult{
		TotalKg:         round1(total),
		Composition:     comp,
		PrimaryCategory: primary,
		Confidence:      round2(0.55 + fill*0.42),
	}
}

func clamp(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func round1(v float64) float64 {
	return float64(int((v+0.05)*10)) / 10
}
