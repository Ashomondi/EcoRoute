import api from './apiClient'

export function listWastePoints() {
  return api.get('/waste-points')
}

export function getWastePoint(id) {
  return api.get(`/waste-points/${id}`)
}

export function createWastePoint(data) {
  return api.post('/waste-points', data)
}

export function updateWastePoint(id, data) {
  return api.put(`/waste-points/${id}`, data)
}

export function deleteWastePoint(id) {
  return api.delete(`/waste-points/${id}`)
}

const wasteService = { listWastePoints, getWastePoint, createWastePoint, updateWastePoint, deleteWastePoint }
export default wasteService
