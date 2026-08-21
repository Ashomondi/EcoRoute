import { CircleMarker, Popup } from 'react-leaflet'
import { WASTE_STATUS_LABELS } from '../../utils/constants'

const COLORS = {
  ok: '#10b981',
  warning: '#f59e0b',
  critical: '#dc2626',
}

export default function WasteMarker({ point, selected, onClick }) {
  const color = COLORS[point.status] || '#64748b'
  const radius = point.status === 'critical' ? 14 : point.status === 'warning' ? 11 : 8

  return (
    <CircleMarker
      center={[point.latitude, point.longitude]}
      radius={selected ? radius + 4 : radius}
      pathOptions={{
        color: '#fff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      }}
      eventHandlers={{ click: () => onClick?.(point) }}
    >
      <Popup>
        <strong>{point.name}</strong>
        <div>{WASTE_STATUS_LABELS[point.status]} · {point.current_level_pct}% full</div>
        {point.prediction && <div className="muted">Forecast tomorrow: {point.prediction.predicted_level_tomorrow}%</div>}
      </Popup>
    </CircleMarker>
  )
}
