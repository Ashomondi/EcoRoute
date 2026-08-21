import { useCallback } from 'react'
import wasteService from '../services/wasteService'
import { useLoad } from './useLoad'

export function useWastePoints() {
  const list = useCallback(() => wasteService.listWastePoints(), [])
  const state = useLoad(list, { initial: [] })
  return { ...state, wastePoints: state.data }
}
