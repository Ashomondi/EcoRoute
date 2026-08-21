import { formatKm, formatNumber } from '../../utils/format'
import { ROUTE_STATUS_LABELS } from '../../utils/constants'

/**
 * @param {{
 *   route: import('../../types/route').Route,
 *   onSelect?: (route: import('../../types/route').Route) => void,
 * }} props
 */
export default function RouteCard({ route, onSelect }) {
  return (
    <div
      className="card"
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
      onClick={() => onSelect?.(route)}
    >
      <div className="card-head">
        <h3>{route.ordered_point_ids.length} stops</h3>
        <span className={`badge badge-${route.status}`}>{ROUTE_STATUS_LABELS[route.status] || route.status}</span>
      </div>
      <p className="muted">
        {formatKm(route.distance_km)} · {route.estimated_minutes} min ·{' '}
        {formatNumber(route.estimated_fuel_l, 1)} L
      </p>
    </div>
  )
}
