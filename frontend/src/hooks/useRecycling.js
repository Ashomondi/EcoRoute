import { useCallback, useState } from 'react'
import recyclingService from '../services/recyclingService'
import { useLoad } from './useLoad'

export function useWasteTypes() {
  const load = useCallback(() => recyclingService.listWasteTypes(), [])
  const state = useLoad(load, { initial: [] })
  return { ...state, wasteTypes: state.data }
}

export function useRecyclers(params = {}) {
  const load = useCallback(() => recyclingService.listRecyclers(params), [params.lat, params.lng, params.radius_km, params.type])
  const state = useLoad(load, { initial: [], deps: [params.lat, params.lng, params.radius_km, params.type] })
  return { ...state, recyclers: state.data }
}

export function useMyRecycling() {
  const load = useCallback(() => recyclingService.getImpact(), [])
  const state = useLoad(load, { initial: null })
  return { ...state, impact: state.data }
}

export function useRecyclingRecords() {
  const load = useCallback(() => recyclingService.listMyRecords(), [])
  const state = useLoad(load, { initial: [] })
  return { ...state, records: state.data }
}

export function useRecycle() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (data) => {
    setSubmitting(true)
    setError(null)
    try {
      return await recyclingService.createRecord(data)
    } catch (err) {
      setError(err.message || 'Could not record recycling')
      return null
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, error }
}
