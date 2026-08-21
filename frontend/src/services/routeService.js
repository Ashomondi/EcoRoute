import { api } from './apiClient'

/** @param {string} truckId @returns {Promise<import('../types/route').OptimizationResult>} */
export function optimizeRoute(truckId) {
  return api.post('/routes/optimize', { truck_id: truckId })
}

/** @returns {Promise<import('../types/route').Route[]>} */
export function listRoutes(truckId) {
  return api.get(truckId ? `/routes?truck_id=${truckId}` : '/routes')
}

/** @returns {Promise<import('../types/route').Route>} */
export function getRoute(id) {
  return api.get(`/routes/${id}`)
}

/** @returns {Promise<import('../types/route').RouteStop[]>} */
export function getRouteStops(id) {
  return api.get(`/routes/${id}/stops`)
}

/** @param {import('../types/route').Route['status']} status */
export function updateRouteStatus(id, status) {
  return api.put(`/routes/${id}/status`, { status })
}
