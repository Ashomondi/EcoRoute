import api from './apiClient'

export function listTrucks() {
  return api.get('/trucks')
}

export function getTruck(id) {
  return api.get(`/trucks/${id}`)
}

export function createTruck(data) {
  return api.post('/trucks', data)
}

export function updateTruck(id, data) {
  return api.put(`/trucks/${id}`, data)
}

export function assignDriver(id, driverId) {
  return api.put(`/trucks/${id}/driver`, { driver_id: driverId })
}

export function deleteTruck(id) {
  return api.delete(`/trucks/${id}`)
}

const truckService = { listTrucks, getTruck, createTruck, updateTruck, assignDriver, deleteTruck }
export default truckService
