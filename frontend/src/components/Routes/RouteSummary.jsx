import { formatKm } from '../../utils/format'

export default function RouteSummary({ route, stops = [] }) {
  const items = [
    { label: 'Distance', value: formatKm(route.distance_km) },
    { label: 'Est. time', value: `${route.estimated_minutes} min` },
    { label: 'Est. fuel', value: `${route.estimated_fuel_l} L` },
    { label: 'Stops', value: String(stops.length || route.ordered_point_ids?.length || 0) },
  ]
  return (
    <div className="grid cols-4">
      {items.map((it) => (
        <div className="card stat-card" key={it.label}>
          <div className="stat-label muted">{it.label}</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{it.value}</div>
        </div>
      ))}
    </div>
  )
}
