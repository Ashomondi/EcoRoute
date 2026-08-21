import { useCallback, useEffect, useRef, useState } from 'react'

export function useLoad(loader, { deps = [], initial = null, autoload = true } = {}) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(Boolean(autoload))
  const [error, setError] = useState(null)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  }, [loader])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await loaderRef.current()
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'Something went wrong')
      return null
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    if (autoload) reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, setData, reload }
}
