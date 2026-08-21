import { WASTE_STATUS_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/format'
import WasteLevelIndicator from './WasteLevelIndicator'

export default function WastePointCard({ point, actions }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{point.name}</h3>
        <span className={`badge badge-${point.status}`}>
          <span className={`status-dot ${point.status}`} /> {WASTE_STATUS_LABELS[point.status]}
        </span>
      </div>
      <WasteLevelIndicator level={point.current_level_pct} />
      <div className="stat-sub muted">
        {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
      </div>
      <div className="stat-sub muted">Last collected: {formatDate(point.last_collected_at)}</div>
      {point.prediction && (
        <div className="stat-sub" style={{ marginTop: 8 }}>
          <span className="badge badge-medium">AI forecast</span>{' '}
          <span className="muted">tomorrow ~{point.prediction.predicted_level_tomorrow}%</span>
        </div>
      )}
      {actions && <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>{actions}</div>}
    </div>
  )
}
