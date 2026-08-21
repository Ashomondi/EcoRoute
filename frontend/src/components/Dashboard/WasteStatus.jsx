import { WASTE_STATUS_LABELS } from '../../utils/constants'
import WasteLevelIndicator from '../Waste/WasteLevelIndicator'

export default function WasteStatus({ wastePoints, onSelect }) {
  if (!wastePoints?.length) return <div className="empty">No waste points yet.</div>
  return (
    <div>
      {wastePoints.map((wp) => (
        <button
          key={wp.id}
          type="button"
          onClick={() => onSelect?.(wp)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            padding: '10px 0',
            cursor: 'pointer',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 14 }}>{wp.name}</strong>
            <span className={`badge badge-${wp.status}`}>{WASTE_STATUS_LABELS[wp.status]}</span>
          </div>
          <WasteLevelIndicator level={wp.current_level_pct} showLabel={false} />
        </button>
      ))}
    </div>
  )
}
