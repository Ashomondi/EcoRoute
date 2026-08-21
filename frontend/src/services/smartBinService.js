import api from './apiClient'

export function readWastePoint(id, trigger = 'manual') {
  return api.post(`/waste-points/${id}/read`, { trigger })
}

export function listBinReadings(id) {
  return api.get(`/waste-points/${id}/readings`)
}

export function listAllReadings() {
  return api.get('/smart-bins/readings')
}

export function smartBinAnalytics() {
  return api.get('/smart-bins/analytics')
}

const smartBinService = {
  readWastePoint,
  listBinReadings,
  listAllReadings,
  smartBinAnalytics,
}
export default smartBinService
