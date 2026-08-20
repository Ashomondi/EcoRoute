export default function StatCard({ label, value, unit, sub }) {
  return (
    <div className="card stat-card">
      <p className="muted stat-label">{label}</p>
      <p className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </p>
      {sub && <p className="muted stat-sub">{sub}</p>}
    </div>
  )
}
