import { Link } from 'react-router-dom'
import WasteMap from '../../components/Map/WasteMap'
import StatCard from '../../components/Dashboard/StatCard'
import PerformanceCard from '../../components/Dashboard/PerformanceCard'
import { useAuth } from '../../hooks/useAuth'
import { useWastePoints } from '../../hooks/useWastePoints'
import { useCollections } from '../../hooks/useCollections'
import { useReports } from '../../hooks/useReports'
import { formatNumber, timeAgo } from '../../utils/format'
import {
  PRIORITY_LABELS,
  PROBLEM_TYPE_LABELS,
  REPORT_STATUS_BADGES,
  REPORT_STATUS_LABELS,
} from '../../utils/constants'

export default function CommunityDashboard() {
  const { user } = useAuth()
  const { points, loading: pointsLoading } = useWastePoints()
  const { summary, activity, loading: activityLoading } = useCollections()
  const { reports, loading: reportsLoading } = useReports()

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ', Resident'} 👋</h1>
        <p className="muted">Here&apos;s what&apos;s happening in your neighborhood.</p>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 16 }}>
        <StatCard label="Reports made" value={summary ? summary.reports_made : '…'} />
        <StatCard
          label="Waste diverted"
          value={summary ? formatNumber(summary.waste_diverted_kg) : '…'}
          unit="kg"
        />
        <StatCard label="Community rank" value={summary ? `${summary.rank}` : '…'} sub="among your neighbors" />
        <StatCard label="Critical points" value={pointsLoading ? '…' : points.filter((p) => p.status === 'critical').length} />
      </div>

      <div className="report-banner">
        <div>
          <h2>Spot an issue in your neighborhood?</h2>
          <p style={{ opacity: 0.9 }}>
            Overflowing bins, missed collections or illegal dumping — report it in seconds.
          </p>
        </div>
        <Link className="btn btn-outline" to="/community/report">
          Report an Issue
        </Link>
      </div>

      <div className="grid cols-2">
        <PerformanceCard title="Waste points near you">
          {pointsLoading ? (
            <div className="spinner" />
          ) : (
            <WasteMap points={points} height="320px" />
          )}
        </PerformanceCard>

        <PerformanceCard title="Local activity">
          {activityLoading ? (
            <div className="spinner" />
          ) : activity.length === 0 ? (
            <p className="empty">No recent activity yet.</p>
          ) : (
            activity.map((item, i) => (
              <div key={i} className="activity-item">
                <span
                  className="status-dot"
                  style={{
                    background: item.type === 'collection' ? 'var(--success)' : 'var(--warning)',
                  }}
                />
                <span style={{ flex: 1 }}>{titleCase(item.message)}</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {timeAgo(item.time)}
                </span>
              </div>
            ))
          )}
        </PerformanceCard>
      </div>

      <div style={{ marginTop: 20 }}>
        <PerformanceCard title="Your reports">
          {reportsLoading ? (
            <div className="spinner" />
          ) : reports.length === 0 ? (
            <p className="empty">
              You haven&apos;t made any reports yet.{' '}
              <Link to="/community/report">Report your first issue</Link>.
            </p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="activity-item">
                <span
                  className="status-dot"
                  style={{
                    background:
                      r.status === 'resolved'
                        ? 'var(--success)'
                        : r.status === 'in_progress'
                          ? 'var(--info)'
                          : 'var(--warning)',
                  }}
                />
                <span style={{ flex: 1 }}>
                  {PROBLEM_TYPE_LABELS[r.problem_type] || r.problem_type}
                  {r.photo_url && <span className="badge badge-low" style={{ marginLeft: 6 }}>Photo</span>}
                  {' · '}
                  <span className={`badge ${REPORT_STATUS_BADGES[r.status] || 'badge-warning'}`}>
                    {REPORT_STATUS_LABELS[r.status] || r.status}
                  </span>
                  {' · '}
                  <span className={`badge badge-${r.priority}`}>
                    {PRIORITY_LABELS[r.priority] || r.priority}
                  </span>
                </span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {timeAgo(r.created_at)}
                </span>
              </div>
            ))
          )}
        </PerformanceCard>
      </div>
    </div>
  )
}
