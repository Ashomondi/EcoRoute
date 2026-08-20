import { CircleMarker, Tooltip } from 'react-leaflet'

const COLOR = {
  critical: '#dc2626',
  warning: '#f59e0b',
  ok: '#10b981',
}

export default function WasteMarker({ point, onClick }) {
  const color = COLOR[point.status] || COLOR.ok

  return (
    <CircleMarker
      center={[point.latitude, point.longitude]}
      radius={8}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.85 }}
      eventHandlers={{ click: () => onClick?.(point) }}
    >
      <Tooltip direction="top" offset={[0, -8]}>
        <strong>{point.name}</strong>
        <br />
        {point.current_level_pct}% — {point.status}
      </Tooltip>
    </CircleMarker>
  )
}
