import { useCallback, useEffect, useState } from 'react'
import { getCommunityActivity, getCommunitySummary } from '../services/collectionService'

export function useCollections() {
  const [summary, setSummary] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [s, a] = await Promise.all([getCommunitySummary(), getCommunityActivity()])
      setSummary(s)
      setActivity(a)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { summary, activity, loading, error, refetch }
}
