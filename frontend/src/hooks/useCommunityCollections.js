import { useCallback, useEffect, useState } from 'react'
import { getCommunityCollections } from '../services/collectionService'

/**
 * @returns {{
 *   data: import('../types/community').CommunityCollections|null,
 *   loading: boolean,
 *   error: string,
 *   refetch: () => Promise<void>,
 *   updatedAt: Date|null,
 * }}
 */
export function useCommunityCollections() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await getCommunityCollections())
      setUpdatedAt(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch, updatedAt }
}
