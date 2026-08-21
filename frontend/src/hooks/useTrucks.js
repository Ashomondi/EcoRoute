import { useCallback, useEffect, useState } from 'react'
import { listTrucks } from '../services/truckService'

/**
 * @returns {{
 *   trucks: import('../types/truck').Truck[],
 *   loading: boolean,
 *   error: string,
 *   refetch: () => Promise<void>,
 * }}
 */
export function useTrucks() {
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setTrucks(await listTrucks())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { trucks, loading, error, refetch }
}
