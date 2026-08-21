import { ROUTE_STATUS_LABELS } from '../../utils/constants'
import { formatDate, formatKm } from '../../utils/format'

export default function RouteCard({ route, actions, active }) {
  return (
    <div className={`card${active ? ' route-active' : ''}`}>
      <div className="card-head">
        <h3>Truck {route.truck_registration || route.truck_id?.slice(0, 8)}</h3>
        <span className={`badge badge-${route.status === 'planned' ? 'planned' : route.status === 'active' ? 'warning' : 'completed'}`}>
          {ROUTE_STATUS_LABELS[route.status]}
        </span>
      </div>
      <div className="stat-sub muted">
        {formatKm(route.distance_km)} · {route.estimated_minutes} min · {route.estimated_fuel_l} L
      </div>
      <div className="stat-sub muted">{route.ordered_point_ids?.length || 0} stops</div>
      <div className="stat-sub muted">{formatDate(route.created_at)}</div>
      {actions && <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>{actions}</div>}
    </div>
  )
}
