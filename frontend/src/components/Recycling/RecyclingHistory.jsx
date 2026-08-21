import { useRecyclingRecords } from '../../hooks/useRecycling'
import { formatDateTime, formatKg } from '../../utils/format'

export default function RecyclingHistory({ onRecycleAgain }) {
  const { records, loading } = useRecyclingRecords()

  return (
    <div className="card">
      <div className="card-head">
        <h3>Your recycling history</h3>
        <button type="button" className="btn btn-outline" onClick={onRecycleAgain}>
          + Recycle again
        </button>
      </div>
      <p className="sub">Items you have logged for recycling.</p>
      {loading ? (
        <div className="spinner" />
      ) : records.length === 0 ? (
        <div className="empty">Nothing recycled yet — start with a scan above.</div>
      ) : (
        <div className="activity-list">
          {records.map((r) => (
            <div className="activity-item" key={r.id}>
              <span className="activity-icon activity-icon-green">♻</span>
              <span style={{ flex: 1 }}>
                <strong>{r.waste_name}</strong>
                <span className="muted"> · {formatKg(r.estimated_kg)}</span>
                {r.recycler_name && <span className="muted"> · {r.recycler_name}</span>}
              </span>
              <span className="activity-time muted">{formatDateTime(r.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
