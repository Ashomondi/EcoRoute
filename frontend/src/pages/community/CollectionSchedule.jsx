import WasteLevelIndicator from '../../components/Waste/WasteLevelIndicator'
import { useWastePoints } from '../../hooks/useWastePoints'
import { formatDate, formatPct } from '../../utils/format'
import { STATUS_LABELS } from '../../utils/constants'

export default function CollectionSchedule() {
  const { points, loading, error } = useWastePoints()

  const critical = points.filter((p) => p.status === 'critical')
  const warning = points.filter((p) => p.status === 'warning')
  const healthy = points.filter((p) => p.status === 'ok')

  return (
    <div>
      <div className="page-header">
        <h1>Collection Schedule</h1>
        <p className="muted">Collection status for collection points in your area</p>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <div className="spinner" />
      ) : points.length === 0 ? (
        <p className="empty">No collection points registered.</p>
      ) : (
        <>
          <div className="grid cols-3" style={{ marginBottom: 20 }}>
            <StatMini label="Need collection soon" count={critical.length} tone="var(--danger)" />
            <StatMini label="Nearing capacity" count={warning.length} tone="var(--warning)" />
            <StatMini label="Healthy" count={healthy.length} tone="var(--success)" />
          </div>

          <div className="grid cols-3">
            {points.map((p) => (
              <div key={p.id} className="card">
                <div className="card-head">
                  <h3>{p.name}</h3>
                  <span className={`badge badge-${p.status}`}>{STATUS_LABELS[p.status] || p.status}</span>
                </div>
                <p className="muted">
                  Level: {formatPct(p.current_level_pct)} · Last collected: {formatDate(p.last_collected_at)}
                </p>
                <WasteLevelIndicator level={p.current_level_pct} status={p.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StatMini({ label, count, tone }) {
  return (
    <div className="card">
      <p className="stat-value" style={{ color: tone }}>
        {count}
      </p>
      <p className="muted stat-label">{label}</p>
    </div>
  )
}
