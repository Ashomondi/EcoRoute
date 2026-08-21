import { useState } from 'react'
import OptimizationResult from '../../components/Routes/OptimizationResult'
import RouteCard from '../../components/Routes/RouteCard'
import WasteMap from '../../components/Map/WasteMap'
import { useTrucks } from '../../hooks/useTrucks'
import { useRoutes } from '../../hooks/useRoutes'
import routeService from '../../services/routeService'

export default function RoutesPage() {
  const { trucks, loading: trucksLoading } = useTrucks()
  const { routes, loading: routesLoading, optimize, optimizing, optimizeError, updateStatus } = useRoutes()
  const [result, setResult] = useState(null)
  const [stops, setStops] = useState([])
  const [selectedTruck, setSelectedTruck] = useState('')
  const [actionError, setActionError] = useState('')

  const handleOptimize = async () => {
    if (!selectedTruck) return
    setActionError('')
    const res = await optimize(selectedTruck)
    if (res) {
      setResult(res)
      setStops(res.stops || [])
    }
  }

  const handleViewStops = async (routeId) => {
    try {
      const s = await routeService.getRouteStops(routeId)
      setStops(s.map((stop) => stop.waste_point))
    } catch (err) {
      setActionError(err.message)
    }
  }

  const handleStatus = async (routeId, status) => {
    try {
      await updateStatus(routeId, status)
    } catch (err) {
      setActionError(err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Route optimization</h1>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>Optimize a route</h3>
        </div>
        <p className="sub">Pick a truck to build the shortest capacity-aware route.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="select" style={{ maxWidth: 320 }} value={selectedTruck} onChange={(e) => setSelectedTruck(e.target.value)} disabled={trucksLoading}>
            <option value="">{trucksLoading ? 'Loading trucks…' : 'Select a truck…'}</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.registration_number}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" onClick={handleOptimize} disabled={!selectedTruck || optimizing}>
            {optimizing ? 'Optimizing…' : '⚡ Optimize route'}
          </button>
        </div>
        {optimizeError && <div className="error">{optimizeError}</div>}
        {actionError && <div className="error">{actionError}</div>}
      </div>

      {result && (
        <div style={{ marginBottom: 20 }}>
          <OptimizationResult result={result} />
        </div>
      )}

      {(stops.length > 1 || result) && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-head">
            <h3>Route map</h3>
          </div>
          <p className="sub">Optimized stop order on the map.</p>
          <WasteMap wastePoints={stops} routePoints={stops} height={380} />
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3>All routes</h3>
        </div>
        <p className="sub">Planned, active and completed routes.</p>
        {routesLoading ? (
          <div className="spinner" />
        ) : routes.length === 0 ? (
          <div className="empty">No routes yet. Optimize one above.</div>
        ) : (
          <div className="grid cols-3">
            {routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                actions={
                  <>
                    <button type="button" className="btn btn-outline" onClick={() => handleViewStops(route.id)}>
                      View stops
                    </button>
                    {route.status === 'planned' && (
                      <button type="button" className="btn btn-primary" onClick={() => handleStatus(route.id, 'active')}>
                        Activate
                      </button>
                    )}
                    {route.status === 'active' && (
                      <button type="button" className="btn btn-primary" onClick={() => handleStatus(route.id, 'completed')}>
                        Complete
                      </button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
