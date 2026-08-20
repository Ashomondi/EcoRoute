export default function RouteCard({ route, onSelect }) {
  return (
    <div
      className="card"
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
      onClick={() => onSelect?.(route)}
    >
      <div className="card-head">
        <h3>{route.ordered_point_ids.length} stops</h3>
        <span className={`badge badge-${route.status}`}>{route.status}</span>
      </div>
      <p className="muted">
        {route.distance_km.toFixed(1)} km · {route.estimated_minutes} min ·{' '}
        {route.estimated_fuel_l.toFixed(1)} L
      </p>
    </div>
  )
}
