import { useEffect, useState } from 'react'
import WasteMap from '../../components/Map/WasteMap'
import RouteSummary from '../../components/Routes/RouteSummary'
import { useRoutes } from '../../hooks/useRoutes'
import { getRouteStops, updateRouteStatus } from '../../services/routeService'
import { markCollected } from '../../services/collectionService'
import { formatKm, formatPct, titleCase } from '../../utils/format'
import { ROUTE_STATUS_LABELS } from '../../utils/constants'

function haversineKm(a, b) {
  const toRad = Math.PI / 180
  const dLat = (b.latitude - a.latitude) * toRad
  const dLng = (b.longitude - a.longitude) * toRad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * toRad) * Math.cos(b.latitude * toRad) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export default function MyRoute() {
  const { routes, loading, refetch } = useRoutes()
  const [route, setRoute] = useState(null)
  const [stops, setStops] = useState([])
  const [stopsLoading, setStopsLoading] = useState(false)
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
    setStopsLoading(true)
    getRouteStops(route.id)
      .then((s) => {
        if (live) {
          setStops(s)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (live) {
          setStopsLoading(false)
        }
      })
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
    return <p className="empty">No route assigned yet. Ask an admin to optimize a route for your truck.</p>
  }

  const done = stops.filter((s) => collected[s.waste_point.id] === 'collected').length
  const remainingStops = stops.filter((s) => collected[s.waste_point.id] !== 'collected')
  let remainingKm = 0
  for (let i = 0; i < remainingStops.length - 1; i++) {
    remainingKm += haversineKm(remainingStops[i].waste_point, remainingStops[i + 1].waste_point)
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Route</h1>
        <span className={`badge badge-${route.status}`}>
          {ROUTE_STATUS_LABELS[route.status] || route.status}
        </span>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>
          {stopsLoading ? '…' : stops.length} stops · {titleCase(route.status)}
        </h3>
        <RouteSummary route={route} />
        <p className="muted" style={{ marginTop: 12 }}>
          {stopsLoading
            ? 'Loading stops…'
            : `Progress: ${done} of ${stops.length} collected${
                remainingKm > 0 ? ` · ~${formatKm(remainingKm)} left` : ''
              }`}
        </p>
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

      {stopsLoading ? (
        <div className="spinner" />
      ) : stops.length === 0 ? (
        <p className="empty">This route has no stops.</p>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <WasteMap points={stops.map((s) => s.waste_point)} route={stops.map((s) => s.waste_point)} height="300px" />
          </div>

          <div className="grid cols-2">
            {stops.map((s) => (
              <div key={s.waste_point.id} className="card">
                <div className="card-head">
                  <h3>
                    {s.order}. {s.waste_point.name}
                  </h3>
                  <span className={`badge badge-${s.waste_point.status}`}>{titleCase(s.waste_point.status)}</span>
                </div>
                <p className="muted">Fill level: {formatPct(s.waste_point.current_level_pct)}</p>

                {route.status === 'active' && !collected[s.waste_point.id] && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn btn-primary" type="button" disabled={busy} onClick={() => mark(s.waste_point.id, 'collected')}>
                      Mark Collected
                    </button>
                    <button className="btn btn-outline" type="button" disabled={busy} onClick={() => mark(s.waste_point.id, 'failed')}>
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
        </>
      )}
    </div>
  )
}
