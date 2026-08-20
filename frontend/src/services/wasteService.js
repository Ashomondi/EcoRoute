import { api } from './apiClient'

export function listWastePoints() {
  return api.get('/waste-points')
}

export function getWastePoint(id) {
  return api.get(`/waste-points/${id}`)
}

export function createWastePoint(input) {
  return api.post('/waste-points', input)
}

export function updateWastePoint(id, input) {
  return api.put(`/waste-points/${id}`, input)
}
