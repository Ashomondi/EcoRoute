import api from './apiClient'

export function optimizeRoute(truckId) {
  return api.post('/routes/optimize', { truck_id: truckId })
}

export function listRoutes(params = {}) {
  return api.get('/routes', { params })
}

export function getRoute(id) {
  return api.get(`/routes/${id}`)
}

export function getRouteStops(id) {
  return api.get(`/routes/${id}/stops`)
}

export function updateRouteStatus(id, status) {
  return api.put(`/routes/${id}/status`, { status })
}

const routeService = { optimizeRoute, listRoutes, getRoute, getRouteStops, updateRouteStatus }
export default routeService
