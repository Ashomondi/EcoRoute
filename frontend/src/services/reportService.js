import { api } from './apiClient'

export function createReport(input) {
  return api.post('/reports', input)
}

export function listMyReports() {
  return api.get('/reports/mine')
}
