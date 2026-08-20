package services

import (
	"context"
	"fmt"
	"math"
	"sort"

	"ecoroute/backend/internal/models"
	"ecoroute/backend/internal/repositories"
	"ecoroute/backend/internal/utils"
)

const (
	avgSpeedKmh         = 25.0
	dwellMinutesPerStop = 10
	fuelLPerKm          = 0.2
	fuelLPerStop        = 0.1
	kgPerLevelPct       = 10.0
)

type RouteService struct {
	repo   *repositories.RouteRepository
	trucks *repositories.TruckRepository
	waste  *repositories.WasteRepository
}

func NewRouteService(repo *repositories.RouteRepository, trucks *repositories.TruckRepository, waste *repositories.WasteRepository) *RouteService {
	return &RouteService{repo: repo, trucks: trucks, waste: waste}
}

func (s *RouteService) OptimizeRoute(ctx context.Context, truckID string) (*models.OptimizationResult, error) {
	truck, err := s.trucks.GetByID(ctx, truckID)
	if err != nil {
		return nil, err
	}
	if truck == nil {
		return nil, ErrNotFound
	}

	points, err := s.waste.List(ctx)
	if err != nil {
		return nil, err
	}

	candidates := make([]models.WastePoint, 0, len(points))
	for _, p := range points {
		if p.CurrentLevelPct > 0 {
			candidates = append(candidates, p)
		}
	}
	sort.SliceStable(candidates, func(a, b int) bool {
		ra, rb := statusRank(candidates[a].Status), statusRank(candidates[b].Status)
		if ra != rb {
			return ra < rb
		}
		if candidates[a].CurrentLevelPct != candidates[b].CurrentLevelPct {
			return candidates[a].CurrentLevelPct > candidates[b].CurrentLevelPct
		}
		return candidates[a].Name < candidates[b].Name
	})

	selected := make([]models.WastePoint, 0, len(candidates))
	used := 0.0
	for _, c := range candidates {
		demand := kgPerLevelPct * float64(c.CurrentLevelPct)
		if used+demand > truck.CapacityKg {
			continue
		}
		selected = append(selected, c)
		used += demand
	}

	optimized := nearestNeighbor(selected, truck.CurrentLat, truck.CurrentLng)
	optimized = twoOpt(optimized, truck.CurrentLat, truck.CurrentLng)

	optDist := routeLength(optimized, truck.CurrentLat, truck.CurrentLng)
	baseDist := routeLength(selected, truck.CurrentLat, truck.CurrentLng)

	optMinutes, optFuel := estimateTimeFuel(optDist, len(optimized))
	baseMinutes, baseFuel := estimateTimeFuel(baseDist, len(selected))

	route := &models.Route{
		TruckID:            truckID,
		OrderedPointIDs:    pointIDs(optimized),
		DistanceKm:         optDist,
		BaselineDistanceKm: baseDist,
		EstimatedFuelL:     optFuel,
		EstimatedMinutes:   optMinutes,
		Status:             models.RouteStatusPlanned,
	}
	if err := s.repo.Save(ctx, route); err != nil {
		return nil, err
	}

	stops := make([]models.RouteStop, len(optimized))
	for i, p := range optimized {
		stops[i] = models.RouteStop{Order: i + 1, WastePoint: p}
	}

	return &models.OptimizationResult{
		RouteID:            route.ID,
		TruckID:            truckID,
		Stops:              stops,
		DistanceKm:         optDist,
		EstimatedMinutes:   optMinutes,
		EstimatedFuelL:     optFuel,
		BaselineDistanceKm: baseDist,
		BaselineMinutes:    baseMinutes,
		BaselineFuelL:      baseFuel,
		DistanceSavedKm:    baseDist - optDist,
		FuelSavedL:         baseFuel - optFuel,
		TimeSavedMinutes:   baseMinutes - optMinutes,
	}, nil
}

func (s *RouteService) ListForUser(ctx context.Context, userID, role, truckID string) ([]models.Route, error) {
	switch role {
	case string(models.RoleAdmin):
		if truckID != "" {
			return s.repo.ListByTruck(ctx, truckID)
		}
		return s.repo.List(ctx)
	case string(models.RoleDriver):
		truck, err := s.trucks.GetByDriver(ctx, userID)
		if err != nil {
			return nil, err
		}
		if truck == nil {
			return []models.Route{}, nil
		}
		if truckID != "" && truckID != truck.ID {
			return nil, ErrForbidden
		}
		return s.repo.ListByTruck(ctx, truck.ID)
	default:
		return nil, ErrForbidden
	}
}

func (s *RouteService) GetByID(ctx context.Context, id string) (*models.Route, error) {
	route, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if route == nil {
		return nil, ErrNotFound
	}
	return route, nil
}

func (s *RouteService) GetStops(ctx context.Context, routeID string) ([]models.RouteStop, error) {
	route, err := s.GetByID(ctx, routeID)
	if err != nil {
		return nil, err
	}

	byID, err := s.waste.GetMany(ctx, route.OrderedPointIDs)
	if err != nil {
		return nil, err
	}

	stops := make([]models.RouteStop, 0, len(route.OrderedPointIDs))
	for i, id := range route.OrderedPointIDs {
		wp, ok := byID[id]
		if !ok {
			continue
		}
		stops = append(stops, models.RouteStop{Order: i + 1, WastePoint: wp})
	}
	return stops, nil
}

func (s *RouteService) UpdateStatus(ctx context.Context, userID, role, id, status string) (*models.Route, error) {
	route, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if role == string(models.RoleDriver) {
		truck, err := s.trucks.GetByDriver(ctx, userID)
		if err != nil {
			return nil, err
		}
		if truck == nil || truck.ID != route.TruckID {
			return nil, ErrForbidden
		}
	}

	switch status {
	case models.RouteStatusPlanned, models.RouteStatusActive, models.RouteStatusCompleted:
	default:
		return nil, fmt.Errorf("%w: invalid route status", ErrValidation)
	}

	updated, err := s.repo.UpdateStatus(ctx, id, status)
	if err != nil {
		return nil, err
	}

	switch status {
	case models.RouteStatusActive:
		if err := s.trucks.SetStatus(ctx, route.TruckID, models.TruckStatusEnRoute); err != nil {
			return nil, err
		}
	case models.RouteStatusCompleted:
		if err := s.trucks.SetStatus(ctx, route.TruckID, models.TruckStatusIdle); err != nil {
			return nil, err
		}
	}
	return updated, nil
}

func statusRank(status string) int {
	switch status {
	case models.StatusCritical:
		return 0
	case models.StatusWarning:
		return 1
	default:
		return 2
	}
}

func estimateTimeFuel(distKm float64, stops int) (minutes int, fuel float64) {
	driveMinutes := distKm / avgSpeedKmh * 60
	minutes = int(math.Round(driveMinutes + float64(dwellMinutesPerStop*stops)))
	fuel = distKm*fuelLPerKm + float64(stops)*fuelLPerStop
	return minutes, fuel
}

func pointIDs(points []models.WastePoint) []string {
	ids := make([]string, len(points))
	for i, p := range points {
		ids[i] = p.ID
	}
	return ids
}

func nearestNeighbor(points []models.WastePoint, tLat, tLng float64) []models.WastePoint {
	remaining := make([]models.WastePoint, len(points))
	copy(remaining, points)

	result := make([]models.WastePoint, 0, len(points))
	curLat, curLng := tLat, tLng
	for len(remaining) > 0 {
		best := 0
		bestDist := utils.HaversineKm(curLat, curLng, remaining[0].Latitude, remaining[0].Longitude)
		for k := 1; k < len(remaining); k++ {
			d := utils.HaversineKm(curLat, curLng, remaining[k].Latitude, remaining[k].Longitude)
			if d < bestDist-1e-9 {
				best = k
				bestDist = d
			}
		}
		next := remaining[best]
		result = append(result, next)
		remaining = append(remaining[:best], remaining[best+1:]...)
		curLat, curLng = next.Latitude, next.Longitude
	}
	return result
}

func twoOpt(points []models.WastePoint, tLat, tLng float64) []models.WastePoint {
	n := len(points)
	for {
		improved := false
		for i := 0; i < n-1; i++ {
			for j := i + 1; j < n; j++ {
				oldLen := 0.0
				if i == 0 {
					oldLen = edgeLength(points, -1, 0, tLat, tLng)
				} else {
					oldLen = edgeLength(points, i-1, i, tLat, tLng)
				}
				if j < n-1 {
					oldLen += edgeLength(points, j, j+1, tLat, tLng)
				}

				newLen := 0.0
				if i == 0 {
					newLen = edgeLength(points, -1, j, tLat, tLng)
				} else {
					newLen = edgeLength(points, i-1, j, tLat, tLng)
				}
				if j < n-1 {
					newLen += edgeLength(points, i, j+1, tLat, tLng)
				}

				if newLen < oldLen-1e-9 {
					reverse(points, i, j)
					improved = true
				}
			}
		}
		if !improved {
			return points
		}
	}
}

func reverse(points []models.WastePoint, i, j int) {
	for i < j {
		points[i], points[j] = points[j], points[i]
		i++
		j--
	}
}

func edgeLength(points []models.WastePoint, a, b int, tLat, tLng float64) float64 {
	if a == -1 {
		return utils.HaversineKm(tLat, tLng, points[b].Latitude, points[b].Longitude)
	}
	if b == -1 {
		return utils.HaversineKm(points[a].Latitude, points[a].Longitude, tLat, tLng)
	}
	return utils.HaversineKm(points[a].Latitude, points[a].Longitude, points[b].Latitude, points[b].Longitude)
}

func routeLength(points []models.WastePoint, tLat, tLng float64) float64 {
	if len(points) == 0 {
		return 0
	}
	total := edgeLength(points, -1, 0, tLat, tLng)
	for k := 0; k < len(points)-1; k++ {
		total += edgeLength(points, k, k+1, tLat, tLng)
	}
	return total
}
