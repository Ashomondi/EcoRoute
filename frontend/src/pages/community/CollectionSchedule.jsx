import { useState } from 'react'
import WasteLevelIndicator from '../../components/Waste/WasteLevelIndicator'
import PerformanceCard from '../../components/Dashboard/PerformanceCard'
import { useWastePoints } from '../../hooks/useWastePoints'
import { useCommunityCollections } from '../../hooks/useCommunityCollections'
import { formatDateTime, formatKg, formatNumber, formatPct, timeAgo } from '../../utils/format'
import { ROUTE_STATUS_LABELS, STATUS_LABELS } from '../../utils/constants'

export default function CollectionSchedule() {
  const { points, loading: pointsLoading, error: pointsError, refetch: refetchPoints } = useWastePoints()
  const { data, loading, error, refetch: refetchCollections, updatedAt } = useCommunityCollections()
  const [refreshing, setRefreshing] = useState(false)

  const upcoming = data?.upcoming ?? []
  const past = data?.past ?? []
  const collectedCount = past.filter((c) => c.outcome === 'collected').length
  const failedCount = past.length - collectedCount
  const criticalCount = points.filter((p) => p.status === 'critical').length

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await Promise.all([refetchCollections(), refetchPoints()])
    } finally {
      setRefreshing(false)
    }
  }

  const initialLoading = (loading && !data) || (pointsLoading && points.length === 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Collection Schedule</h1>
          <p className="muted">Upcoming collections and recent pickup history in your area</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {updatedAt && (
            <span className="muted" style={{ fontSize: 12 }}>
              Updated {timeAgo(updatedAt.toISOString())}
            </span>
          )}
          <button className="btn btn-outline" type="button" disabled={refreshing} onClick={handleRefresh}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {(error || pointsError) && <p className="error">{error || pointsError}</p>}

      {initialLoading ? (
        <div className="spinner" />
      ) : (
        <>
          <div className="grid cols-4" style={{ marginBottom: 20 }}>
            <StatMini label="Need collection" count={criticalCount} tone="var(--danger)" />
            <StatMini label="Scheduled" count={upcoming.length} tone="var(--primary)" />
            <StatMini label="Collected" count={collectedCount} tone="var(--success)" />
            <StatMini label="Failed" count={failedCount} tone="var(--warning)" />
          </div>

          <PerformanceCard title="Upcoming collections">
            {upcoming.length === 0 ? (
              <p className="empty">
                No collections scheduled yet — the city team will plan the next run.
              </p>
            ) : (
              <div className="grid cols-3">
                {upcoming.map((u) => (
                  <div key={u.waste_point_id} className="card">
                    <div className="card-head">
                      <h3>{u.waste_point_name}</h3>
                      <span className={`badge badge-${u.status}`}>
                        {STATUS_LABELS[u.status] || u.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
                      <span className={`badge badge-${u.route_status}`}>
                        {ROUTE_STATUS_LABELS[u.route_status] || u.route_status}
                      </span>
                      {u.related && <span className="badge badge-high">In your reports</span>}
                    </div>
                    <p className="muted">
                      Stop {u.order} of {u.stop_count} · Truck {u.truck_registration}
                    </p>
                    <p className="muted">
                      Level: {formatPct(u.current_level_pct)} · ~{formatNumber(u.estimated_minutes)} min
                    </p>
                    <WasteLevelIndicator level={u.current_level_pct} status={u.status} />
                  </div>
                ))}
              </div>
            )}
          </PerformanceCard>

          <PerformanceCard title="Recent collections">
            {past.length === 0 ? (
              <p className="empty">No collection history yet.</p>
            ) : (
              <div>
                {past.map((c) => (
                  <div key={c.id} className="activity-item">
                    <span
                      className="status-dot"
                      style={{
                        background:
                          c.outcome === 'collected' ? 'var(--success)' : 'var(--danger)',
                      }}
                    />
                    <span style={{ flex: 1 }}>
                      <strong>{c.waste_point_name}</strong>{' '}
                      <span className={`badge ${c.outcome === 'collected' ? 'badge-ok' : 'badge-failed'}`}>
                        {c.outcome === 'collected' ? 'Collected' : 'Failed'}
                      </span>
                    </span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {formatKg(c.estimated_kg)} · {formatDateTime(c.collected_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </PerformanceCard>

          <div style={{ marginTop: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Collection points in your area</h3>
            {points.length === 0 ? (
              <p className="empty">No collection points registered.</p>
            ) : (
              <div className="grid cols-3">
                {points.map((p) => (
                  <div key={p.id} className="card">
                    <div className="card-head">
                      <h3>{p.name}</h3>
                      <span className={`badge badge-${p.status}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </div>
                    <p className="muted">
                      Level: {formatPct(p.current_level_pct)} · Last collected:{' '}
                      {formatDateTime(p.last_collected_at)}
                    </p>
                    <WasteLevelIndicator level={p.current_level_pct} status={p.status} />
                  </div>
                ))}
              </div>
            )}
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
