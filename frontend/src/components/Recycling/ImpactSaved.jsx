import { formatKg, formatNumber } from '../../utils/format'

export default function ImpactSaved({ impact }) {
  const stats = [
    { label: 'Total recycled', value: formatKg(impact?.total_kg), icon: '♻' },
    { label: 'CO₂ saved', value: `${formatNumber(impact?.co2_saved_kg, 2)} kg`, icon: '🌍' },
    { label: 'Energy saved', value: `${formatNumber(impact?.energy_saved_kwh, 1)} kWh`, icon: '⚡' },
    { label: 'Landfill diverted', value: formatKg(impact?.landfill_diverted_kg), icon: '🗑' },
  ]

  return (
    <div>
      <div className="community-greeting" style={{ marginBottom: 16 }}>
        <span className="community-greeting-tag">Recycled!</span>
        <h1>Impact saved 🌍</h1>
        <p>Every item you recycle keeps waste out of landfill and emissions out of the air.</p>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 20 }}>
        {stats.map((s) => (
          <div className="card stat-card" key={s.label}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div className="stat-label muted">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 24 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {impact?.by_type?.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h3>By material</h3>
          </div>
          <div className="compare-bar">
            {impact.by_type.map((t) => (
              <div className="compare-row" key={t.slug}>
                <span className="row-label">{t.name}</span>
                <div className="compare-track">
                  <div className="impact-fill" style={{ width: `${Math.min(100, (t.kg / Math.max(impact.total_kg, 1)) * 100)}%` }} />
                </div>
                <span className="row-value">{formatKg(t.kg)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
