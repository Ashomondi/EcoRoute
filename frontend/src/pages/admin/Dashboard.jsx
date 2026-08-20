import WasteMap from '../../components/Map/WasteMap'
import StatCard from '../../components/Dashboard/StatCard'
import PerformanceCard from '../../components/Dashboard/PerformanceCard'
import { useWastePoints } from '../../hooks/useWastePoints'
import { useTrucks } from '../../hooks/useTrucks'
import { useAnalytics } from '../../hooks/useAnalytics'

export default function Dashboard() {
  const { points, loading: pointsLoading, error: pointsError } = useWastePoints()
  const { trucks, loading: trucksLoading } = useTrucks()
  const { summary, loading: summaryLoading } = useAnalytics()

  const critical = points.filter((p) => p.status === 'critical').length
  const activeTrucks = trucks.filter((t) => t.status === 'en_route').length

  return (
    <div>
      <div className="page-header">
        <h1>Operations Dashboard</h1>
        <p className="muted">Live city overview</p>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 16 }}>
        <StatCard label="Waste points" value={pointsLoading ? '…' : points.length} />
        <StatCard label="Critical" value={pointsLoading ? '…' : critical} sub="need collection soon" />
        <StatCard label="Active trucks" value={trucksLoading ? '…' : activeTrucks} />
        <StatCard
          label="Collected today"
          value={summaryLoading ? '…' : summary?.collected_today ?? 0}
          sub={summary ? `${summary.collected_today_kg.toFixed(0)} kg diverted` : undefined}
        />
      </div>

      {pointsError && <p className="error">{pointsError}</p>}

      <WasteMap points={points} />

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <PerformanceCard title="Fleet status">
          {trucksLoading ? (
            <p className="muted">Loading…</p>
          ) : trucks.length === 0 ? (
            <p className="empty">No trucks registered.</p>
          ) : (
            trucks.map((t) => (
              <div key={t.id} className="compare-row" style={{ marginBottom: 8 }}>
                <span className="row-label" style={{ width: 90, textAlign: 'left' }}>
                  {t.registration_number}
                </span>
                <span className="row-value" style={{ width: 'auto' }}>
                  {t.status.replace('_', ' ')}
                </span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {t.driver_id ? 'driver assigned' : 'no driver'}
                </span>
              </div>
            ))
          )}
        </PerformanceCard>

        <PerformanceCard title="Priority hotspots">
          {points.filter((p) => p.status !== 'ok').length === 0 ? (
            <p className="empty">All points are healthy.</p>
          ) : (
            points
              .filter((p) => p.status !== 'ok')
              .map((p) => (
                <div key={p.id} className="compare-row" style={{ marginBottom: 8 }}>
                  <span className="status-dot" style={{ background: p.status === 'critical' ? 'var(--danger)' : 'var(--warning)' }} />
                  <span className="row-label" style={{ width: 'auto', textAlign: 'left' }}>
                    {p.name}
                  </span>
                  <span className="row-value" style={{ width: 'auto' }}>
                    {p.current_level_pct}%
                  </span>
                </div>
              ))
          )}
        </PerformanceCard>
      </div>
    </div>
  )
}
