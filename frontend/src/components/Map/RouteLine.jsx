import { Polyline, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'

const stopIcon = (order) =>
  L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#0f766e;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)">${order}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })

export default function RouteLine({ points, showStops = false, color = '#0f766e' }) {
  if (!points || points.length === 0) return null
  const positions = points.map((p) => [p.latitude, p.longitude])

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color, weight: 4, opacity: 0.85 }}
      />
      {showStops &&
        points.map((p, i) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={stopIcon(i + 1)}>
            <Tooltip>
              {i + 1}. {p.name}
            </Tooltip>
          </Marker>
        ))}
    </>
  )
}
