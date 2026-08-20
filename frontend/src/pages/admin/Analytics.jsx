import StatCard from '../../components/Dashboard/StatCard'
import PerformanceCard from '../../components/Dashboard/PerformanceCard'
import { useAnalytics } from '../../hooks/useAnalytics'

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
        <StatCard label="Distance saved" value={summary.distance_saved_km.toFixed(1)} unit="km" />
        <StatCard label="Fuel saved" value={summary.fuel_saved_l.toFixed(1)} unit="L" />
        <StatCard
          label="Time saved"
          value={(summary.distance_saved_km > 0 ? summary.distance_saved_km / 25 : 0).toFixed(1)}
          unit="hrs"
        />
        <StatCard
          label="Waste collected today"
          value={summary.collected_today_kg.toFixed(0)}
          unit="kg"
        />
        <StatCard label="CO2 reduced" value={summary.co2_avoided_kg.toFixed(0)} unit="kg" />
        <StatCard
          label="Collection rate"
          value={summary.collection_rate_pct.toFixed(0)}
          unit="%"
        />
        <StatCard label="Routes optimized" value={summary.total_routes} />
        <StatCard label="Trees equivalent" value={trees} sub="this week" />
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <PerformanceCard title="Route efficiency">
          <div className="compare-bar">
            <div className="compare-row">
              <span className="row-label">Before</span>
              <div className="compare-track">
                <div style={{ width: '100%', background: 'var(--danger)' }} />
              </div>
              <span className="row-value">{beforeKm.toFixed(1)} km</span>
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
              <span className="row-value">{summary.total_distance_km.toFixed(1)} km</span>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Optimized routes drove {summary.distance_saved_km.toFixed(1)} km less than the naive
            baseline.
          </p>
        </PerformanceCard>

        <PerformanceCard title="Impact highlights">
          <p className="muted" style={{ marginBottom: 8 }}>
            Every optimized kilometre avoided an estimated {summary.fuel_saved_l.toFixed(1)} L of
            fuel and {summary.co2_avoided_kg.toFixed(1)} kg of CO2.
          </p>
          <p className="muted">
            {summary.collected_today} collections today diverted{' '}
            {summary.collected_today_kg.toFixed(0)} kg from landfill — equivalent to planting{' '}
            {trees} trees this week.
          </p>
        </PerformanceCard>
      </div>
    </div>
  )
}
