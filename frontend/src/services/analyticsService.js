import { api } from './apiClient'

export function getAnalyticsSummary() {
  return api.get('/analytics/summary')
}
