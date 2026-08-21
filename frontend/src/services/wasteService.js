import { api } from './apiClient'

/** @returns {Promise<import('../types/wastePoint').WastePoint[]>} */
export function listWastePoints() {
  return api.get('/waste-points')
}

/** @returns {Promise<import('../types/wastePoint').WastePoint>} */
export function getWastePoint(id) {
  return api.get(`/waste-points/${id}`)
}

/** @param {import('../types/wastePoint').WastePointInput} input @returns {Promise<import('../types/wastePoint').WastePoint>} */
export function createWastePoint(input) {
  return api.post('/waste-points', input)
}

/** @param {import('../types/wastePoint').WastePointInput} input @returns {Promise<import('../types/wastePoint').WastePoint>} */
export function updateWastePoint(id, input) {
  return api.put(`/waste-points/${id}`, input)
}
