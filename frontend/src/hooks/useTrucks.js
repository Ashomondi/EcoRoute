import { useCallback } from 'react'
import truckService from '../services/truckService'
import { useLoad } from './useLoad'

export function useTrucks() {
  const list = useCallback(() => truckService.listTrucks(), [])
  const state = useLoad(list, { initial: [] })
  return { ...state, trucks: state.data }
}
