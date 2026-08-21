import StatCard from '../../components/Dashboard/StatCard'
import PerformanceCard from '../../components/Dashboard/PerformanceCard'
import { useAnalytics } from '../../hooks/useAnalytics'
import { formatKm, formatNumber } from '../../utils/format'

const TREES_PER_CO2_KG = 15 / 340

export default function Analytics() {
  const { summary, loading, error } = useAnalytics()

  if (loading) {
    return <div className="spinner" />
  }
  if (error) {
    return <p className="error">{error}</p>
  }
  if (!summary) {
    return <p className="empty">No analytics yet.</p>
  }

  const beforeKm = summary.total_distance_km + summary.distance_saved_km
  const trees = Math.round(summary.co2_avoided_kg * TREES_PER_CO2_KG)

  return (
    <div>
      <div className="page-header">
        <h1>Environmental Impact</h1>
      </div>

      <div className="grid cols-4">
        <StatCard label="Distance saved" value={formatNumber(summary.distance_saved_km, 1)} unit="km" />
        <StatCard label="Fuel saved" value={formatNumber(summary.fuel_saved_l, 1)} unit="L" />
        <StatCard
          label="Time saved"
          value={formatNumber(summary.distance_saved_km > 0 ? summary.distance_saved_km / 25 : 0, 1)}
          unit="hrs"
        />
        <StatCard
          label="Waste collected today"
          value={formatNumber(summary.collected_today_kg)}
          unit="kg"
        />
        <StatCard label="CO2 reduced" value={formatNumber(summary.co2_avoided_kg)} unit="kg" />
        <StatCard
          label="Collection rate"
          value={formatNumber(summary.collection_rate_pct)}
          unit="%"
        />
        <StatCard label="Routes optimized" value={formatNumber(summary.total_routes)} />
        <StatCard label="Trees equivalent" value={formatNumber(trees)} sub="this week" />
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <PerformanceCard title="Route efficiency">
          <div className="compare-bar">
            <div className="compare-row">
              <span className="row-label">Before</span>
              <div className="compare-track">
                <div style={{ width: '100%', background: 'var(--danger)' }} />
              </div>
              <span className="row-value">{formatKm(beforeKm)}</span>
            </div>
            <div className="compare-row">
              <span className="row-label">After</span>
              <div className="compare-track">
                <div
                  style={{
                    width: `${summary.total_distance_km > 0 ? Math.min(100, (summary.total_distance_km / beforeKm) * 100) : 0}%`,
                    background: 'var(--primary)',
                  }}
                />
              </div>
              <span className="row-value">{formatKm(summary.total_distance_km)}</span>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Optimized routes drove {formatKm(summary.distance_saved_km)} less than the naive
            baseline.
          </p>
        </PerformanceCard>

        <PerformanceCard title="Impact highlights">
          <p className="muted" style={{ marginBottom: 8 }}>
            Every optimized kilometre avoided an estimated {formatNumber(summary.fuel_saved_l, 1)} L of
            fuel and {formatNumber(summary.co2_avoided_kg, 1)} kg of CO2.
          </p>
          <p className="muted">
            {summary.collected_today} collections today diverted{' '}
            {formatNumber(summary.collected_today_kg)} kg from landfill — equivalent to planting{' '}
            {formatNumber(trees)} trees this week.
          </p>
        </PerformanceCard>
      </div>
    </div>
  )
}
