import { useCallback } from 'react'
import reportService from '../services/reportService'
import { useLoad } from './useLoad'

export function useReports(params = {}) {
  const list = useCallback(() => reportService.listReports(params), [params.status])
  const state = useLoad(list, { initial: [], deps: [params.status] })
  return { ...state, reports: state.data }
}

export function useMyReports() {
  const list = useCallback(() => reportService.listMyReports(), [])
  const state = useLoad(list, { initial: [] })
  return { ...state, reports: state.data }
}
