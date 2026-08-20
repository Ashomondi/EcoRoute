import { useCallback, useEffect, useState } from 'react'
import { listWastePoints } from '../services/wasteService'

export function useWastePoints() {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPoints(await listWastePoints())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { points, loading, error, refetch }
}
