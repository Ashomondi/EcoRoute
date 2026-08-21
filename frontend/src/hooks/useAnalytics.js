import { useCallback, useEffect, useState } from 'react'
import { getAnalyticsSummary } from '../services/analyticsService'

/**
 * @returns {{
 *   summary: import('../types/analytics').AnalyticsSummary|null,
 *   loading: boolean,
 *   error: string,
 *   refetch: () => Promise<void>,
 * }}
 */
export function useAnalytics() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setSummary(await getAnalyticsSummary())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { summary, loading, error, refetch }
}
