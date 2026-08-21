import { useCallback } from 'react'
import analyticsService from '../services/analyticsService'
import { useLoad } from './useLoad'

export function useAnalytics() {
  const loadSummary = useCallback(() => analyticsService.getSummary(), [])
  const loadTrend = useCallback((days = 7) => analyticsService.getTrend(days), [])
  const summary = useLoad(loadSummary, { initial: null })
  const trend = useLoad(loadTrend, { initial: [] })
  return { ...summary, ...trend, reloadAll: () => Promise.all([summary.reload(), trend.reload()]) }
}
