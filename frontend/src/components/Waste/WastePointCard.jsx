import WasteLevelIndicator from './WasteLevelIndicator'
import WasteStatus from '../Dashboard/WasteStatus'

export default function WastePointCard({ point, onSelect }) {
  return (
    <div
      className="card"
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
      onClick={() => onSelect?.(point)}
    >
      <div className="card-head">
        <h3>{point.name}</h3>
        <WasteStatus status={point.status} />
      </div>
      <p className="muted">{point.current_level_pct}% full</p>
      <WasteLevelIndicator level={point.current_level_pct} status={point.status} />
    </div>
  )
}
