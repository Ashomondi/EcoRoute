import { useState } from 'react'
import RouteCard from '../../components/Routes/RouteCard'
import OptimizationResult from '../../components/Routes/OptimizationResult'
import WasteMap from '../../components/Map/WasteMap'
import { useTrucks } from '../../hooks/useTrucks'
import { useRoutes } from '../../hooks/useRoutes'

export default function Routes() {
  const { trucks } = useTrucks()
  const { routes, loading, error, optimize } = useRoutes()
  const [truckId, setTruckId] = useState('')
  const [result, setResult] = useState(null)
  const [optimizing, setOptimizing] = useState(false)
  const [optError, setOptError] = useState('')

  async function onOptimize() {
    if (!truckId) {
      return
    }
    setOptimizing(true)
    setOptError('')
    setResult(null)
    try {
      setResult(await optimize(truckId))
    } catch (e) {
      setOptError(e.message)
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Route Optimization</h1>
        <p className="muted">One click to a shorter, cheaper route.</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid cols-3">
          <div className="field">
            <label>Truck</label>
            <select
              className="select"
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
            >
              <option value="">Select a truck…</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.registration_number}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!truckId || optimizing}
              onClick={onOptimize}
            >
              {optimizing ? 'Optimizing…' : 'Optimize Route'}
            </button>
          </div>
        </div>
        {optError && <p className="error">{optError}</p>}
      </div>

      {result && <OptimizationResult result={result} />}

      {result && result.stops.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <WasteMap
            points={result.stops.map((s) => s.waste_point)}
            route={result.stops.map((s) => s.waste_point)}
            height="360px"
          />
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Saved routes</h3>
        {error && <p className="error">{error}</p>}
        {loading ? (
          <div className="spinner" />
        ) : routes.length === 0 ? (
          <p className="empty">No routes yet — optimize one above.</p>
        ) : (
          <div className="grid cols-3">
            {routes.map((r) => (
              <RouteCard key={r.id} route={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
