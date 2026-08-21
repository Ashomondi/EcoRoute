import { useCallback, useState } from 'react'
import smartBinService from '../services/smartBinService'
import { useLoad } from './useLoad'

export function useSmartBinAnalytics() {
  const load = useCallback(() => smartBinService.smartBinAnalytics(), [])
  const state = useLoad(load, { initial: null })
  return { ...state, analytics: state.data }
}

export function useBinReadings(id) {
  const load = useCallback(() => (id ? smartBinService.listBinReadings(id) : Promise.resolve([])), [id])
  const state = useLoad(load, { initial: [], deps: [id] })
  return { ...state, readings: state.data }
}

export function useReadBin() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const read = async (id, trigger = 'manual') => {
    setBusy(true)
    setError(null)
    try {
      return await smartBinService.readWastePoint(id, trigger)
    } catch (err) {
      setError(err.message || 'AI read failed')
      return null
    } finally {
      setBusy(false)
    }
  }
  return { read, busy, error }
}
