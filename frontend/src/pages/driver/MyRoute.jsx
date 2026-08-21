import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRoutes } from '../../hooks/useRoutes'
import routeService from '../../services/routeService'
import collectionService from '../../services/collectionService'
import { useLoad } from '../../hooks/useLoad'

export default function MyRoute() {
  const { routes, loading: routesLoading, updateStatus, reload } = useRoutes()
  const [routeId, setRouteId] = useState(null)
  const loadStops = useCallback(() => (routeId ? routeService.getRouteStops(routeId) : []), [routeId])
  const { data: stops, loading: stopsLoading, setData: setStops, reload: reloadStops } = useLoad(loadStops, { initial: [], deps: [routeId] })
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  const activeRoute = routes.find((r) => r.status === 'active')
  const plannedRoute = routes.find((r) => r.status === 'planned')
  const currentRoute = activeRoute || plannedRoute

  const startRoute = async () => {
    if (!plannedRoute) return
    try {
      await updateStatus(plannedRoute.id, 'active')
      setRouteId(plannedRoute.id)
      await reloadStops()
    } catch (err) {
      setError(err.message)
    }
  }

  const openRoute = async (route) => {
    setRouteId(route.id)
    await reloadStops()
  }

  const markStop = async (stop, outcome) => {
    if (!routeId) return
    setBusy(stop.waste_point.id)
    setError('')
    try {
      await collectionService.markCollected(stop.waste_point.id, outcome, routeId)
      setStops((prev) => prev.filter((s) => s.waste_point.id !== stop.waste_point.id))
      if (stops.length - 1 === 0 && outcome === 'collected') {
        await updateStatus(routeId, 'completed')
      }
      await reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  if (routesLoading) return <div className="spinner" />

  if (!currentRoute) {
    return (
      <div className="card">
        <div className="card-head">
          <h3>No route assigned</h3>
        </div>
        <p className="sub">There is no planned or active route for your truck yet.</p>
        <Link to="/driver" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>My route</h1>
        {activeRoute ? (
          <span className="badge badge-warning">
            <span className="status-dot warning" /> Active
          </span>
        ) : (
          <button type="button" className="btn btn-primary" onClick={startRoute}>
            Start route
          </button>
        )}
      </div>

      {!routeId && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-head">
            <h3>Routes for your truck</h3>
          </div>
          <div className="grid cols-3">
            {routes.map((r) => (
              <div className="card" key={r.id}>
                <div className="card-head">
                  <h3>{r.distance_km.toFixed(1)} km</h3>
                  <span className={`badge badge-${r.status === 'planned' ? 'planned' : r.status === 'active' ? 'warning' : 'completed'}`}>
                    {r.status}
                  </span>
                </div>
                <div className="stat-sub muted">{r.estimated_minutes} min · {r.estimated_fuel_l} L fuel</div>
                <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => openRoute(r)}>
                  Open route
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {routeId && (
        <div className="card">
          <div className="card-head">
            <h3>Stops in order</h3>
            <span className="muted">{stops.length} remaining</span>
          </div>
          <p className="sub">Mark each stop collected or failed as you complete it.</p>
          {error && <div className="error" style={{ marginBottom: 10 }}>{error}</div>}
          {stopsLoading ? (
            <div className="spinner" />
          ) : stops.length === 0 ? (
            <div className="empty">
              <p>All stops done! 🎉</p>
              <Link to="/driver" className="btn btn-primary" style={{ marginTop: 12 }}>
                Back to dashboard
              </Link>
            </div>
          ) : (
            <div>
              {stops.map((stop) => (
                <div className="report-item" key={stop.waste_point.id}>
                  <span className="report-icon report-icon-green">{stop.order}</span>
                  <div className="report-item-body">
                    <div className="report-item-title">
                      <strong>{stop.waste_point.name}</strong>
                      <span className={`badge badge-${stop.waste_point.status}`}>
                        {stop.waste_point.current_level_pct}%
                      </span>
                    </div>
                    <div className="report-item-meta muted">
                      <span>Est. {stop.waste_point.current_level_pct * 10} kg</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy === stop.waste_point.id}
                      onClick={() => markStop(stop, 'collected')}
                    >
                      Collected
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={busy === stop.waste_point.id}
                      onClick={() => markStop(stop, 'failed')}
                    >
                      Failed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
