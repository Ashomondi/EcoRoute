import api from './apiClient'

export function listCollections() {
  return api.get('/collections')
}

export function markCollected(wastePointId, outcome, routeId) {
  return api.post(`/collections/${wastePointId}`, { outcome, route_id: routeId })
}

const collectionService = { listCollections, markCollected }
export default collectionService
