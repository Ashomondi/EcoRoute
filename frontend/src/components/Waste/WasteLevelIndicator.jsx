import { levelColor } from '../../utils/format'

export default function WasteLevelIndicator({ level, showLabel = true }) {
  const color = levelColor(level)
  const width = Math.max(2, Math.min(100, level))
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span className="muted">Fill level</span>
          <strong>{level}%</strong>
        </div>
      )}
      <div className="level-bar">
        <div style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  )
}
