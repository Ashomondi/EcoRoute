import api from './apiClient'

export function listWasteTypes() {
  return api.get('/recycling/waste-types')
}

export function listRecyclers(params = {}) {
  return api.get('/recycling/recyclers', { params })
}

export function createRecycler(data) {
  return api.post('/recycling/recyclers', data)
}

export function updateRecycler(id, data) {
  return api.put(`/recycling/recyclers/${id}`, data)
}

export function deleteRecycler(id) {
  return api.delete(`/recycling/recyclers/${id}`)
}

export function createRecord(data) {
  return api.post('/recycling/records', data)
}

export function listRecords() {
  return api.get('/recycling/records')
}

export function listMyRecords() {
  return api.get('/recycling/records/mine')
}

export function getImpact() {
  return api.get('/recycling/impact')
}

export function getImpactTotal() {
  return api.get('/recycling/impact/total')
}

const recyclingService = {
  listWasteTypes,
  listRecyclers,
  createRecycler,
  updateRecycler,
  deleteRecycler,
  createRecord,
  listRecords,
  listMyRecords,
  getImpact,
  getImpactTotal,
}
export default recyclingService
