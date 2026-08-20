export default function RouteSummary({ route }) {
  if (!route) {
    return null
  }
  return (
    <div className="grid cols-3">
      <Mini label="Distance" value={route.distance_km.toFixed(1)} unit="km" />
      <Mini label="Est. time" value={route.estimated_minutes} unit="min" />
      <Mini label="Est. fuel" value={route.estimated_fuel_l.toFixed(1)} unit="L" />
    </div>
  )
}

function Mini({ label, value, unit }) {
  return (
    <div className="card stat-card">
      <p className="muted stat-label">{label}</p>
      <p className="stat-value">
        {value}
        <span className="stat-unit">{unit}</span>
      </p>
    </div>
  )
}
