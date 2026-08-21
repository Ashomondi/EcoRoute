import StatCard from '../../components/Dashboard/StatCard'
import { useAnalytics } from '../../hooks/useAnalytics'
import { formatKg, formatNumber, formatPercent } from '../../utils/format'

export default function Analytics() {
  const { summary, trend, loading, reloadAll } = useAnalytics()

  const maxCount = Math.max(...(trend?.map((d) => d.collected_count) || []), 1)

  return (
    <div>
      <div className="page-header">
        <h1>Analytics & impact</h1>
        <button type="button" className="btn btn-outline" onClick={reloadAll}>
          Refresh
        </button>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 20 }}>
        <StatCard label="Collected today" value={loading ? '…' : formatNumber(summary?.collected_today)} sub={`${formatKg(summary?.collected_today_kg)} collected`} />
        <StatCard label="Recycled" value={loading ? '…' : formatKg(summary?.recycled_kg)} sub="total recycled" />
        <StatCard label="Landfill diverted" value={loading ? '…' : formatKg(summary?.landfill_diverted_kg)} sub="kept out of landfill" />
        <StatCard label="Collection rate" value={loading ? '…' : formatPercent(summary?.collection_rate_pct)} sub="successful vs attempted" />
      </div>

      <div className="grid cols-4" style={{ marginBottom: 20 }}>
        <StatCard label="Distance saved" value={loading ? '…' : `${formatNumber(summary?.distance_saved_km, 1)} km`} sub={`${formatNumber(summary?.total_distance_km, 1)} km total`} />
        <StatCard label="Fuel saved" value={loading ? '…' : `${formatNumber(summary?.fuel_saved_l, 1)} L`} sub="vs naive baseline" />
        <StatCard label="CO₂ avoided" value={loading ? '…' : `${formatNumber(summary?.co2_avoided_kg, 1)} kg`} sub="fuel + recycling" />
        <StatCard label="Routes" value={loading ? '…' : formatNumber(summary?.total_routes)} sub="all-time" />
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Collection trend</h3>
        </div>
        <p className="sub">Daily collected vs failed over the last 7 days.</p>
        {loading ? (
          <div className="spinner" />
        ) : trend.length === 0 ? (
          <div className="empty">No collection history yet.</div>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 220, padding: '10px 0' }}>
            {trend.map((d) => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <div className="muted" style={{ fontSize: 12 }}>{d.collected_count}</div>
                <div style={{ width: '100%', borderRadius: 8, background: 'var(--primary)', height: `${Math.max(4, (d.collected_count / maxCount) * 150)}px` }} title={`${d.collected_count} collected`} />
                {d.failed_count > 0 && (
                  <div style={{ width: '100%', borderRadius: 8, background: 'var(--danger)', height: `${Math.max(4, (d.failed_count / maxCount) * 150)}px` }} title={`${d.failed_count} failed`} />
                )}
                <span className="muted" style={{ fontSize: 11 }}>
                  {new Date(d.day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
