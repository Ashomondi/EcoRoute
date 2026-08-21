export default function PerformanceCard({ title, sub, rows }) {
  const max = Math.max(...rows.map((r) => r.value || 0), 1)
  return (
    <div className="card">
      {title && (
        <div className="card-head">
          <h3>{title}</h3>
        </div>
      )}
      {sub && <p className="sub">{sub}</p>}
      <div className="compare-bar">
        {rows.map((row, i) => (
          <div className="compare-row" key={i}>
            <span className="row-label">{row.label}</span>
            <div className="compare-track">
              <div
                className="impact-fill"
                style={{ width: `${Math.round(((row.value || 0) / max) * 100)}%`, background: row.color || undefined }}
              />
            </div>
            <span className="row-value">{row.display}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
