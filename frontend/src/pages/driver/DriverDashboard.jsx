import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useRoutes } from '../../hooks/useRoutes'
import { useTrucks } from '../../hooks/useTrucks'

export default function DriverDashboard() {
  const { user } = useAuth()
  const { routes, loading: routesLoading } = useRoutes()
  const { trucks, loading: trucksLoading } = useTrucks()
  const myTruck = trucks.find((t) => t.driver_id === user.id)
  const activeRoute = routes.find((r) => r.status === 'active')
  const plannedRoute = routes.find((r) => r.status === 'planned')

  return (
    <div>
      <div className="page-header">
        <h1>Driver dashboard</h1>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="stat-label muted">Assigned truck</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{trucksLoading ? '…' : myTruck?.registration_number || 'None'}</div>
          <div className="stat-sub muted">Capacity {myTruck ? `${myTruck.capacity_kg} kg` : '—'}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label muted">Active route</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{routesLoading ? '…' : activeRoute ? 'In progress' : 'None'}</div>
          <div className="stat-sub muted">{activeRoute ? `${activeRoute.stops_remaining ?? ''}` : plannedRoute ? 'A route is planned' : 'No routes yet'}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label muted">Truck status</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{trucksLoading ? '…' : myTruck?.status || '—'}</div>
          <div className="stat-sub muted">
            {myTruck ? `${myTruck.current_lat?.toFixed(4)}, ${myTruck.current_lng?.toFixed(4)}` : '—'}
          </div>
        </div>
      </div>

      <div className="report-banner">
        <div>
          <h2>{activeRoute ? 'Your route is live' : plannedRoute ? 'A route is ready for you' : 'No route assigned'}</h2>
          <p>
            {activeRoute
              ? 'Follow the stop order and mark each collection as you go.'
              : plannedRoute
                ? 'Start the planned route to begin collections.'
                : 'The dispatch team has not assigned you a route yet.'}
          </p>
        </div>
        <Link to="/driver/route" className="btn btn-outline">
          {activeRoute ? 'Open route →' : plannedRoute ? 'Start route →' : 'View routes'}
        </Link>
      </div>
    </div>
  )
}
