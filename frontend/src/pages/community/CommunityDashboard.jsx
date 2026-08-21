import { Link } from 'react-router-dom'
import WasteMap from '../../components/Map/WasteMap'
import PerformanceCard from '../../components/Dashboard/PerformanceCard'
import { useAuth } from '../../hooks/useAuth'
import { useWastePoints } from '../../hooks/useWastePoints'
import { useCollections } from '../../hooks/useCollections'
import { useReports } from '../../hooks/useReports'
import { formatNumber, timeAgo, titleCase } from '../../utils/format'
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

  const firstName = user?.name ? user.name.split(' ')[0] : 'Resident'
  const criticalCount = pointsLoading ? '…' : points.filter((p) => p.status === 'critical').length

  return (
    <div className="community-dash">
      <section className="community-greeting">
        <div className="community-greeting-copy">
          <span className="community-greeting-tag">Your neighborhood</span>
          <h1>Welcome back, {firstName}</h1>
          <p>Here&apos;s what&apos;s happening around you today.</p>
        </div>
        <Link className="btn btn-light community-greeting-cta" to="/community/report">
          Report an issue
        </Link>
      </section>

      <div className="grid cols-4 community-stat-grid">
        <CommunityStat
          icon="report"
          tone="teal"
          label="Reports made"
          value={summary ? formatNumber(summary.reports_made) : '…'}
          sub="submitted by you"
        />
        <CommunityStat
          icon="leaf"
          tone="green"
          label="Waste diverted"
          value={summary ? formatNumber(summary.waste_diverted_kg) : '…'}
          unit="kg"
          sub="kept out of landfill"
        />
        <CommunityStat
          icon="trophy"
          tone="amber"
          label="Community rank"
          value={summary ? `#${summary.rank}` : '…'}
          sub="among your neighbors"
        />
        <CommunityStat
          icon="alert"
          tone="red"
          label="Critical points"
          value={criticalCount}
          sub="need collection now"
        />
      </div>

      <div className="grid cols-2 community-dash-grid">
        <PerformanceCard title="Waste points near you">
          <p className="card-sub">Live map of collection points in your area</p>
          {pointsLoading ? (
            <div className="spinner" />
          ) : (
            <WasteMap points={points} height="320px" />
          )}
        </PerformanceCard>

        <PerformanceCard title="Local activity">
          <p className="card-sub">Latest collections and reports near you</p>
          {activityLoading ? (
            <div className="spinner" />
          ) : activity.length === 0 ? (
            <p className="empty">No recent activity yet.</p>
          ) : (
            <div className="activity-list">
              {activity.map((item, i) => (
                <div key={i} className="activity-item">
                  <span
                    className={`activity-icon ${
                      item.type === 'collection' ? 'activity-icon-green' : 'activity-icon-amber'
                    }`}
                  >
                    <ActivityIcon type={item.type} />
                  </span>
                  <span style={{ flex: 1 }}>{titleCase(item.message)}</span>
                  <span className="muted activity-time">{timeAgo(item.time)}</span>
                </div>
              ))}
            </div>
          )}
        </PerformanceCard>
      </div>

      <div className="community-reports">
        <PerformanceCard title="Your reports">
          <p className="card-sub">Track every issue you&apos;ve raised</p>
          {reportsLoading ? (
            <div className="spinner" />
          ) : reports.length === 0 ? (
            <p className="empty">
              You haven&apos;t made any reports yet.{' '}
              <Link to="/community/report">Report your first issue</Link>.
            </p>
          ) : (
            <div className="activity-list">
              {reports.map((r) => (
                <div key={r.id} className="report-item">
                  <span
                    className={`report-icon ${
                      r.status === 'resolved'
                        ? 'report-icon-green'
                        : r.status === 'in_progress'
                          ? 'report-icon-blue'
                          : 'report-icon-amber'
                    }`}
                  >
                    <ReportIcon status={r.status} />
                  </span>
                  <div className="report-item-body">
                    <div className="report-item-title">
                      <strong>{PROBLEM_TYPE_LABELS[r.problem_type] || r.problem_type}</strong>
                      {r.photo_url && <span className="badge badge-low">Photo</span>}
                    </div>
                    <div className="report-item-meta">
                      <span className={`badge ${REPORT_STATUS_BADGES[r.status] || 'badge-warning'}`}>
                        {REPORT_STATUS_LABELS[r.status] || r.status}
                      </span>
                      <span className={`badge badge-${r.priority}`}>
                        {PRIORITY_LABELS[r.priority] || r.priority} priority
                      </span>
                      <span className="muted activity-time">{timeAgo(r.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PerformanceCard>
      </div>
    </div>
  )
}

function CommunityStat({ icon, tone, label, value, unit, sub }) {
  return (
    <div className={`card community-stat community-stat-${tone}`}>
      <span className="community-stat-icon">
        <StatIcon name={icon} />
      </span>
      <div>
        <p className="muted stat-label">{label}</p>
        <p className="stat-value">
          {value}
          {unit && <span className="stat-unit">{unit}</span>}
        </p>
        <p className="muted stat-sub">{sub}</p>
      </div>
    </div>
  )
}

const svgProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function StatIcon({ name }) {
  switch (name) {
    case 'report':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" {...svgProps}>
          <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
          <path d="M8 7h8m-8 4h8m-8 4h5" />
        </svg>
      )
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" {...svgProps}>
          <path d="M11 20A7 7 0 0 1 4 13c0-6 6-9 16-9 0 10-3 16-9 16z" />
          <path d="M4 20c4-6 8-9 12-11" />
        </svg>
      )
    case 'trophy':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" {...svgProps}>
          <path d="M8 21h8m-4-4v-3m-6 0H4V8h4m8 6h4V8h-4" />
          <path d="M8 4h8v6a4 4 0 0 1-8 0V4zM6 6H4a3 3 0 0 0 3 5m11-5h2a3 3 0 0 1-3 5" />
        </svg>
      )
    case 'alert':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" {...svgProps}>
          <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4m0 4h.01" />
        </svg>
      )
    default:
      return null
  }
}

function ActivityIcon({ type }) {
  return type === 'collection' ? (
    <svg viewBox="0 0 24 24" width="16" height="16" {...svgProps}>
      <circle cx="6" cy="19" r="2.2" />
      <circle cx="18" cy="5" r="2.2" />
      <path d="M6 19C6 10 12 14 18 5" />
      <path d="M12 8l-2-2m0 0l2-2m-2 2h8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" {...svgProps}>
      <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
      <path d="M8 7h8m-8 4h8m-8 4h5" />
    </svg>
  )
}

function ReportIcon({ status }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...svgProps}>
      {status === 'resolved' ? (
        <path d="M20 6L9 17l-5-5" />
      ) : (
        <path d="M12 5v8m0 3h.01M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
      )}
    </svg>
  )
}
