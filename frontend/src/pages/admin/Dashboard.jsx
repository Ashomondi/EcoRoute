import { useCallback, useEffect, useState } from 'react'
import WasteMap from '../../components/Map/WasteMap'
import StatCard from '../../components/Dashboard/StatCard'
import PerformanceCard from '../../components/Dashboard/PerformanceCard'
import { useWastePoints } from '../../hooks/useWastePoints'
import { useTrucks } from '../../hooks/useTrucks'
import { useAnalytics } from '../../hooks/useAnalytics'
import { api } from '../../services/apiClient'
import { formatKg, formatPct, titleCase } from '../../utils/format'
import { TRUCK_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants'

function useOpenReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setReports(await api.get('/reports?status=open'))
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    refetch()
  }, [refetch])
  return { reports, loading, refetch }
}

export default function Dashboard() {
  const { points, loading: pointsLoading, error: pointsError } = useWastePoints()
  const { trucks, loading: trucksLoading } = useTrucks()
  const { summary, loading: summaryLoading } = useAnalytics()
  const { reports, loading: reportsLoading } = useOpenReports()

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
          sub={summary ? `${formatKg(summary.collected_today_kg)} diverted` : undefined}
        />
      </div>

      {pointsError && <p className="error">{pointsError}</p>}

      <WasteMap points={points} />

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <PerformanceCard title="Fleet status">
          {trucksLoading ? (
            <div className="spinner" />
          ) : trucks.length === 0 ? (
            <p className="empty">No trucks registered.</p>
          ) : (
            trucks.map((t) => (
              <div key={t.id} className="compare-row" style={{ marginBottom: 8 }}>
                <span className="row-label" style={{ width: 90, textAlign: 'left' }}>
                  {t.registration_number}
                </span>
                <span className="row-value" style={{ width: 'auto' }}>
                  {TRUCK_STATUS_LABELS[t.status] || t.status}
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

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <PerformanceCard title="Live community reports">
          {reportsLoading ? (
            <div className="spinner" />
          ) : reports.length === 0 ? (
            <p className="empty">No open reports right now.</p>
          ) : (
            reports.slice(0, 6).map((r) => (
              <div key={r.id} className="activity-item">
                <span
                  className="status-dot"
                  style={{ background: r.priority === 'high' ? 'var(--danger)' : 'var(--warning)' }}
                />
                <span style={{ flex: 1 }}>
                  {titleCase(r.problem_type)}
                  {r.waste_point_id ? ' · linked to a point' : ''}
                </span>
                <span className={`badge badge-${r.priority}`}>
                  {PRIORITY_LABELS[r.priority] || r.priority}
                </span>
              </div>
            ))
          )}
        </PerformanceCard>

        <PerformanceCard title="Collection trend">
          {summaryLoading ? (
            <div className="spinner" />
          ) : (
            <>
              <p className="muted" style={{ marginBottom: 8 }}>
                {summary?.collected_today ?? 0} collection(s) today.
              </p>
              <div className="compare-bar">
                <div className="compare-row">
                  <span className="row-label">Collected</span>
                  <div className="compare-track">
                    <div
                      style={{
                        width: '100%',
                        background: 'var(--primary)',
                      }}
                    />
                  </div>
                  <span className="row-value">
                    {formatKg(summary?.collected_today_kg)}
                  </span>
                </div>
                <div className="compare-row">
                  <span className="row-label">Rate</span>
                  <div className="compare-track">
                    <div
                      style={{
                        width: `${summary?.collection_rate_pct ?? 0}%`,
                        background: 'var(--success)',
                      }}
                    />
                  </div>
                  <span className="row-value">
                    {formatPct(summary?.collection_rate_pct)}
                  </span>
                </div>
              </div>
            </>
          )}
        </PerformanceCard>
      </div>
    </div>
  )
}
