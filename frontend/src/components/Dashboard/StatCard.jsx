export default function StatCard({ label, value, unit, sub, icon }) {
  return (
    <div className="card stat-card">
      {icon && <div className="stat-sub" style={{ fontSize: 18 }}>{icon}</div>}
      <div className="stat-label muted">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {sub && <div className="stat-sub muted">{sub}</div>}
    </div>
  )
}
