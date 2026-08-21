import { Link } from 'react-router-dom'
import { useCommunityActivity, useCommunityCollections, useCommunitySummary, useGreeting } from '../../hooks/useCommunity'
import { formatKg, timeAgo } from '../../utils/format'

export default function CommunityDashboard() {
  const { greeting, name } = useGreeting()
  const { summary, loading: summaryLoading } = useCommunitySummary()
  const { collections, loading: collectionsLoading } = useCommunityCollections()
  const { activity, loading: activityLoading } = useCommunityActivity(8)

  return (
    <div>
      <div className="community-dash-layout">
        <aside className="community-dash-aside">
          <div className="community-greeting">
            <span className="community-greeting-tag">Community</span>
            <h1>
              {greeting}, {name}
            </h1>
            <p>Your reports keep the city clean.</p>
          </div>

          <div className="community-side-stats">
            <div className="card community-stat community-stat-teal">
              <span className="community-stat-icon">🛡</span>
              <div>
                <div className="stat-label">Reports made</div>
                <div className="stat-value">{summaryLoading ? '…' : summary?.reports_made ?? 0}</div>
                <div className="stat-sub muted">overall</div>
              </div>
            </div>
            <div className="card community-stat community-stat-green">
              <span className="community-stat-icon">♻</span>
              <div>
                <div className="stat-label">Waste diverted</div>
                <div className="stat-value">{summaryLoading ? '…' : formatKg(summary?.waste_diverted_kg)}</div>
                <div className="stat-sub muted">from reported points</div>
              </div>
            </div>
            <div className="card community-stat community-stat-amber">
              <span className="community-stat-icon">★</span>
              <div>
                <div className="stat-label">Reporter rank</div>
                <div className="stat-value">
                  {summaryLoading ? '…' : `#${summary?.rank ?? '—'}`}
                </div>
                <div className="stat-sub muted">of {summary?.total_reporters ?? 0} residents</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="community-dash-main">
          <div className="report-banner">
            <div>
              <h2>See a problem? Report it.</h2>
              <p>Overflowing bins, missed collections and illegal dumping — flagged in one tap.</p>
            </div>
            <Link to="/community/report" className="btn btn-outline">
              Report Waste →
            </Link>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Upcoming collections</h3>
              <Link to="/community/schedule" className="muted">
                View schedule
              </Link>
            </div>
            <p className="sub">Next scheduled stops in your area, in collection order.</p>
            {collectionsLoading ? (
              <div className="spinner" />
            ) : collections.upcoming.length === 0 ? (
              <div className="empty">No upcoming collections scheduled yet.</div>
            ) : (
              <div className="stop-list">
                {collections.upcoming.map((item) => (
                  <div key={item.route_id + item.waste_point_id} className="report-item">
                    <span className="report-icon report-icon-green">{item.order}</span>
                    <div className="report-item-body">
                      <div className="report-item-title">
                        <strong>{item.waste_point_name}</strong>
                        {item.related && <span className="badge badge-warning">You reported</span>}
                      </div>
                      <div className="report-item-meta muted">
                        <span>Truck {item.truck_registration}</span>
                        <span>·</span>
                        <span>{item.estimated_minutes} min estimated</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card community-reports">
            <div className="card-head">
              <h3>Recent activity</h3>
            </div>
            <p className="sub">Latest collections and reports across the city.</p>
            {activityLoading ? (
              <div className="spinner" />
            ) : activity.length === 0 ? (
              <div className="empty">No recent activity.</div>
            ) : (
              <div className="activity-list">
                {activity.map((item, i) => (
                  <div className="activity-item" key={i}>
                    <span className={`activity-icon ${item.type === 'collection' ? 'activity-icon-green' : 'activity-icon-amber'}`}>
                      {item.type === 'collection' ? '✓' : '⚑'}
                    </span>
                    <span style={{ flex: 1 }}>{item.message}</span>
                    <span className="activity-time muted">{timeAgo(item.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
