import { useCallback, useEffect, useState } from 'react'
import { listRoutes, optimizeRoute } from '../services/routeService'

export function useRoutes() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async (truckId) => {
    setLoading(true)
    setError('')
    try {
      setRoutes(await listRoutes(truckId))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const optimize = useCallback(
    async (truckId) => {
      const result = await optimizeRoute(truckId)
      await refetch(truckId)
      return result
    },
    [refetch],
  )

  return { routes, loading, error, refetch, optimize }
}
