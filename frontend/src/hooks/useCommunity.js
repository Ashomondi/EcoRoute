import { useAuth } from './useAuth'
import communityService from '../services/communityService'
import { useLoad } from './useLoad'

export function useCommunitySummary() {
  const load = () => communityService.getSummary()
  const state = useLoad(load, { initial: null })
  return { ...state, summary: state.data }
}

export function useCommunityActivity(limit = 10) {
  const load = () => communityService.getActivity(limit)
  const state = useLoad(load, { initial: [] })
  return { ...state, activity: state.data }
}

export function useCommunityCollections() {
  const load = () => communityService.getCollections()
  const state = useLoad(load, { initial: { upcoming: [], past: [] } })
  return { ...state, collections: state.data }
}

export function useGreeting() {
  const { user } = useAuth()
  const hour = new Date().getHours()
  let greeting = 'Hello'
  if (hour < 12) greeting = 'Good morning'
  else if (hour < 18) greeting = 'Good afternoon'
  else greeting = 'Good evening'
  return { greeting, name: user?.name?.split(' ')[0] || 'Resident' }
}
