package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"ecoroute/backend/config"
)

type AIPredictionRequest struct {
	WastePointID            string `json:"waste_point_id"`
	CurrentLevelPct         int    `json:"current_level_pct"`
	DaysSinceLastCollection int    `json:"days_since_last_collection"`
}

type AIPredictionResult struct {
	PredictedLevelTomorrow float64 `json:"predicted_level_tomorrow"`
	RecommendCollect       bool    `json:"recommend_collect"`
}

type AIClient struct {
	baseURL string
	client  *http.Client
}

func NewAIClient(cfg *config.Config) *AIClient {
	return &AIClient{
		baseURL: cfg.AIServiceURL,
		client:  &http.Client{Timeout: cfg.AITimeout},
	}
}

func (c *AIClient) Predict(ctx context.Context, req AIPredictionRequest) (*AIPredictionResult, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	endpoint := strings.TrimRight(c.baseURL, "/") + "/predict"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("ai predict request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ai predict returned status %d", resp.StatusCode)
	}

	var result AIPredictionResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("ai predict decode: %w", err)
	}
	return &result, nil
}
