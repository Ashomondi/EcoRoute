import api from './apiClient'

export function getSummary() {
  return api.get('/analytics/summary')
}

export function getTrend(days = 7) {
  return api.get('/analytics/trend', { params: { days } })
}

const analyticsService = { getSummary, getTrend }
export default analyticsService
