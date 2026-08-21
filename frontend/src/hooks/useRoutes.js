import { useCallback, useState } from 'react'
import routeService from '../services/routeService'
import { useLoad } from './useLoad'

export function useRoutes(params = {}) {
  const list = useCallback(() => routeService.listRoutes(params), [params.truck_id])
  const state = useLoad(list, { initial: [], deps: [params.truck_id] })
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeError, setOptimizeError] = useState(null)

  const optimize = async (truckId) => {
    setOptimizing(true)
    setOptimizeError(null)
    try {
      const result = await routeService.optimizeRoute(truckId)
      await state.reload()
      return result
    } catch (err) {
      setOptimizeError(err.message || 'Optimization failed')
      return null
    } finally {
      setOptimizing(false)
    }
  }

  const updateStatus = async (id, status) => {
    const result = await routeService.updateRouteStatus(id, status)
    await state.reload()
    return result
  }

  return { ...state, routes: state.data, optimize, optimizing, optimizeError, updateStatus }
}
