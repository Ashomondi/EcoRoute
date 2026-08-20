import { useCallback, useEffect, useState } from 'react'
import { createReport, listMyReports } from '../services/reportService'

export function useReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setReports(await listMyReports())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const submit = useCallback(
    async (input) => {
      const created = await createReport(input)
      await refetch()
      return created
    },
    [refetch],
  )

  return { reports, loading, error, refetch, submit }
}
