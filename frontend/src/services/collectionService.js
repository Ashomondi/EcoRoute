import { api } from './apiClient'

export function getCommunitySummary() {
  return api.get('/community/summary')
}

export function getCommunityActivity(limit = 10) {
  return api.get(`/community/activity?limit=${limit}`)
}
