import { api } from './apiClient'

/** @returns {Promise<import('../types/community').CommunitySummary>} */
export function getCommunitySummary() {
  return api.get('/community/summary')
}

/** @returns {Promise<import('../types/community').ActivityItem[]>} */
export function getCommunityActivity(limit = 10) {
  return api.get(`/community/activity?limit=${limit}`)
}

/** @returns {Promise<import('../types/collection').CollectionRecord[]>} */
export function listCollections() {
  return api.get('/collections')
}

/** @param {import('../types/collection').CollectionRecord['outcome']} outcome */
export function markCollected(wastePointId, outcome) {
  return api.post(`/collections/${wastePointId}`, { outcome })
}
