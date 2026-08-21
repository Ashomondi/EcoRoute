import { api } from './apiClient'

/** @returns {Promise<import('../types/truck').Truck[]>} */
export function listTrucks() {
  return api.get('/trucks')
}

/** @returns {Promise<import('../types/truck').Truck>} */
export function getTruck(id) {
  return api.get(`/trucks/${id}`)
}

/** @param {import('../types/truck').TruckInput} input @returns {Promise<import('../types/truck').Truck>} */
export function createTruck(input) {
  return api.post('/trucks', input)
}

/** @param {import('../types/truck').TruckInput} input @returns {Promise<import('../types/truck').Truck>} */
export function updateTruck(id, input) {
  return api.put(`/trucks/${id}`, input)
}

/** @returns {Promise<import('../types/truck').Truck>} */
export function assignDriver(truckId, driverId) {
  return api.put(`/trucks/${truckId}/driver`, { driver_id: driverId })
}
