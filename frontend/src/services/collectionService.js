import { api } from './apiClient'

export function getCommunitySummary() {
  return api.get('/community/summary')
}

export function getCommunityActivity(limit = 10) {
  return api.get(`/community/activity?limit=${limit}`)
}

export function listCollections() {
  return api.get('/collections')
}

export function markCollected(wastePointId, outcome) {
  return api.post(`/collections/${wastePointId}`, { outcome })
}
