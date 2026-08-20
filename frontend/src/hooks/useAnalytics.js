import { useCallback, useEffect, useState } from 'react'
import { getAnalyticsSummary } from '../services/analyticsService'

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
