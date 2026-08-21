import api from './apiClient'

export function getSummary() {
  return api.get('/community/summary')
}

export function getActivity(limit = 10) {
  return api.get('/community/activity', { params: { limit } })
}

export function getCollections() {
  return api.get('/community/collections')
}

const communityService = { getSummary, getActivity, getCollections }
export default communityService
