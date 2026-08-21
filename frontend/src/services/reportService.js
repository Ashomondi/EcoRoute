import api from './apiClient'

export function listReports(params = {}) {
  return api.get('/reports', { params })
}

export function listMyReports() {
  return api.get('/reports/mine')
}

export function createReport(data) {
  return api.post('/reports', data)
}

export function updateReportStatus(id, status) {
  return api.put(`/reports/${id}/status`, { status })
}

export function deleteReport(id) {
  return api.delete(`/reports/${id}`)
}

const reportService = { listReports, listMyReports, createReport, updateReportStatus, deleteReport }
export default reportService
