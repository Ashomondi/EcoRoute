import { useCommunityCollections } from '../../hooks/useCommunity'
import { formatDate, formatKg } from '../../utils/format'

export default function CollectionSchedule() {
  const { collections, loading } = useCommunityCollections()

  return (
    <div>
      <div className="page-header">
        <h1>Collection schedule</h1>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>Upcoming collections</h3>
        </div>
        <p className="sub">Scheduled stops in your area, in route order.</p>
        {loading ? (
          <div className="spinner" />
        ) : collections.upcoming.length === 0 ? (
          <div className="empty">No upcoming collections scheduled.</div>
        ) : (
          <div className="grid cols-2">
            {collections.upcoming.map((item) => (
              <div className="card" key={item.route_id + item.waste_point_id}>
                <div className="card-head">
                  <h3>{item.waste_point_name}</h3>
                  {item.related && <span className="badge badge-warning">You reported</span>}
                </div>
                <div className="report-item-meta muted">
                  <span>Stop {item.order} of {item.stop_count}</span>
                  <span>·</span>
                  <span>Truck {item.truck_registration}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div className="level-bar">
                    <div style={{ width: `${item.current_level_pct}%`, background: item.current_level_pct >= 85 ? 'var(--danger)' : item.current_level_pct >= 60 ? 'var(--warning)' : 'var(--success)' }} />
                  </div>
                  <div className="stat-sub muted" style={{ marginTop: 6 }}>
                    {item.current_level_pct}% full — {item.estimated_minutes} min route
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Recent collections</h3>
        </div>
        <p className="sub">Completed collection history in your area.</p>
        {loading ? (
          <div className="spinner" />
        ) : collections.past.length === 0 ? (
          <div className="empty">No collection history yet.</div>
        ) : (
          <div className="activity-list">
            {collections.past.map((item) => (
              <div className="activity-item" key={item.id}>
                <span className={`activity-icon ${item.outcome === 'collected' ? 'activity-icon-green' : 'activity-icon-amber'}`}>
                  {item.outcome === 'collected' ? '✓' : '✕'}
                </span>
                <span style={{ flex: 1 }}>
                  {item.waste_point_name}
                  <span className="muted"> · {formatKg(item.estimated_kg)}</span>
                </span>
                <span className="activity-time muted">{formatDate(item.collected_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
