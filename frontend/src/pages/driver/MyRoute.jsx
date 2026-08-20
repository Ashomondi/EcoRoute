import { useEffect, useState } from 'react'
import { useRoutes } from '../../hooks/useRoutes'
import { getRouteStops, updateRouteStatus } from '../../services/routeService'
import { markCollected } from '../../services/collectionService'
import { titleCase } from '../../utils/format'

export default function MyRoute() {
  const { routes, loading, refetch } = useRoutes()
  const [route, setRoute] = useState(null)
  const [stops, setStops] = useState([])
  const [collected, setCollected] = useState({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const active = routes.find((r) => r.status === 'active') || routes.find((r) => r.status === 'planned')
    setRoute(active || null)
  }, [routes])

  useEffect(() => {
    if (!route) {
      setStops([])
      return
    }
    let live = true
    getRouteStops(route.id)
      .then((s) => {
        if (live) {
          setStops(s)
        }
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [route])

  async function setStatus(status) {
    if (!route) {
      return
    }
    setBusy(true)
    setMsg('')
    setErr('')
    try {
      await updateRouteStatus(route.id, status)
      await refetch()
      setMsg(status === 'active' ? 'Route started.' : 'Route completed.')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function mark(pointId, outcome) {
    setBusy(true)
    setMsg('')
    setErr('')
    try {
      await markCollected(pointId, outcome)
      setCollected((c) => ({ ...c, [pointId]: outcome }))
      setMsg(outcome === 'collected' ? 'Marked as collected.' : 'Problem reported.')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="spinner" />
  }

  if (!route) {
    return (
      <p className="empty">
        No route assigned yet. Ask an admin to optimize a route for your truck.
      </p>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Route</h1>
        <span className={`badge badge-${route.status}`}>{titleCase(route.status)}</span>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>
          {stops.length} stops · {route.distance_km.toFixed(1)} km · ~{route.estimated_minutes} min
        </h3>
        {route.status === 'planned' && (
          <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} disabled={busy} onClick={() => setStatus('active')}>
            Start Route
          </button>
        )}
        {route.status === 'active' && (
          <button className="btn btn-outline" type="button" style={{ marginTop: 12 }} disabled={busy} onClick={() => setStatus('completed')}>
            Complete Route
          </button>
        )}
      </div>

      {msg && <p className="muted" style={{ marginBottom: 8 }}>{msg}</p>}
      {err && <p className="error" style={{ marginBottom: 8 }}>{err}</p>}

      {stops.length === 0 ? (
        <p className="empty">This route has no stops.</p>
      ) : (
        <div className="grid cols-2">
          {stops.map((s) => (
            <div key={s.waste_point.id} className="card">
              <div className="card-head">
                <h3>
                  {s.order}. {s.waste_point.name}
                </h3>
                <span className={`badge badge-${s.waste_point.status}`}>
                  {titleCase(s.waste_point.status)}
                </span>
              </div>
              <p className="muted">Fill level: {s.waste_point.current_level_pct}%</p>

              {route.status === 'active' && !collected[s.waste_point.id] && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={busy}
                    onClick={() => mark(s.waste_point.id, 'collected')}
                  >
                    Mark Collected
                  </button>
                  <button
                    className="btn btn-outline"
                    type="button"
                    disabled={busy}
                    onClick={() => mark(s.waste_point.id, 'failed')}
                  >
                    Report Problem
                  </button>
                </div>
              )}
              {collected[s.waste_point.id] && (
                <span className="badge badge-ok" style={{ marginTop: 12 }}>
                  {collected[s.waste_point.id] === 'collected' ? 'Collected' : 'Problem reported'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
