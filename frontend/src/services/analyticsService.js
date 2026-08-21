import { api } from './apiClient'

/** @returns {Promise<import('../types/analytics').AnalyticsSummary>} */
export function getAnalyticsSummary() {
  return api.get('/analytics/summary')
}
