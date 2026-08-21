import { Link } from 'react-router-dom'
import StatCard from '../../components/Dashboard/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { useTrucks } from '../../hooks/useTrucks'
import { useRoutes } from '../../hooks/useRoutes'
import { formatNumber, titleCase } from '../../utils/format'

export default function DriverDashboard() {
  const { user } = useAuth()
  const { trucks } = useTrucks()
  const { routes, loading } = useRoutes()

  const myTruck = trucks.find((t) => t.driver_id === user?.id)
  const latest = routes[0]

  return (
    <div>
      <div className="page-header">
        <h1>Driver Dashboard</h1>
        <p className="muted">{user?.name || 'Driver'}</p>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <StatCard
          label="My truck"
          value={myTruck?.registration_number || 'Unassigned'}
          sub={myTruck ? titleCase(myTruck.status) : 'No truck assigned yet'}
        />
        <StatCard
          label="Active route"
          value={loading ? '…' : latest ? titleCase(latest.status) : 'None'}
          sub={latest ? `${latest.ordered_point_ids.length} stops` : undefined}
        />
        <StatCard
          label="Route distance"
          value={latest ? formatNumber(latest.distance_km, 1) : '—'}
          unit="km"
        />
      </div>

      <div className="card">
        <h3>Today&apos;s plan</h3>
        <p className="muted" style={{ margin: '8px 0 14px' }}>
          {loading
            ? 'Loading your route…'
            : latest
              ? `You have ${latest.ordered_point_ids.length} stop(s) across ~${latest.estimated_minutes} minutes.`
              : 'No route assigned yet — an admin needs to optimize a route for your truck.'}
        </p>
        {latest && (
          <Link className="btn btn-primary" to="/driver/my-route">
            Go to My Route
          </Link>
        )}
      </div>
    </div>
  )
}
