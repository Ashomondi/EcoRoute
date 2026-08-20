import { api } from './apiClient'

export function listTrucks() {
  return api.get('/trucks')
}

export function getTruck(id) {
  return api.get(`/trucks/${id}`)
}

export function createTruck(input) {
  return api.post('/trucks', input)
}

export function updateTruck(id, input) {
  return api.put(`/trucks/${id}`, input)
}

export function assignDriver(truckId, driverId) {
  return api.put(`/trucks/${truckId}/driver`, { driver_id: driverId })
}
