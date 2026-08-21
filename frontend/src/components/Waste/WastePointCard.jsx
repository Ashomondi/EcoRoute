import { WASTE_STATUS_LABELS, BIN_CATEGORIES, READ_TRIGGER_LABELS } from '../../utils/constants'
import { formatDate, formatKg } from '../../utils/format'
import WasteLevelIndicator from './WasteLevelIndicator'

export function binCategoryLabel(slug) {
  return BIN_CATEGORIES.find((c) => c.slug === slug)?.label || 'Mixed / Other'
}

export function binCategoryEmoji(slug) {
  return BIN_CATEGORIES.find((c) => c.slug === slug)?.emoji || '🗑️'
}

export default function WastePointCard({ point, reading, actions }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{point.name}</h3>
        <span className={`badge badge-${point.status}`}>
          <span className={`status-dot ${point.status}`} /> {WASTE_STATUS_LABELS[point.status]}
        </span>
      </div>
      <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span>{binCategoryEmoji(point.category)} {binCategoryLabel(point.category)}</span>
        <span className="muted">· {formatKg(point.max_capacity_kg)} capacity</span>
      </div>
      <WasteLevelIndicator level={point.current_level_pct} />
      <div className="stat-sub muted">
        {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
      </div>
      <div className="stat-sub muted">Last collected: {formatDate(point.last_collected_at)}</div>
      {point.current_estimated_kg > 0 && (
        <div className="stat-sub" style={{ marginTop: 6 }}>
          <span className="badge badge-medium">AI read</span>{' '}
          <span className="muted">≈ {formatKg(point.current_estimated_kg)} estimated</span>
        </div>
      )}
      {reading && (
        <div className="smart-bin-reading card" style={{ marginTop: 10 }}>
          <div className="stat-sub">
            <strong>Latest AI read</strong>
            <span className="muted"> · {formatKg(reading.total_kg)} · {READ_TRIGGER_LABELS[reading.trigger_type] || reading.trigger_type} · {reading.status}</span>
          </div>
          <div className="smart-bin-bars">
            {Object.entries(reading.composition || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([cat, kg]) => (
                <div className="smart-bin-bar" key={cat}>
                  <div className="smart-bin-bar-top">
                    <span>{binCategoryLabel(cat)}</span>
                    <span className="muted">{kg.toFixed(1)}kg</span>
                  </div>
                  <div className="smart-bin-track">
                    <div
                      className="smart-bin-fill"
                      style={{ width: `${(kg / reading.total_kg) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
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
