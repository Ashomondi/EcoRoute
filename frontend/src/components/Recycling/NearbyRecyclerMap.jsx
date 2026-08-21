import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { KISUMU_CENTER } from '../../utils/constants'

const leafIcon = (color = '#0f766e') =>
  L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${color};color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">♻</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })

export default function NearbyRecyclerMap({ recyclers, selectedId, onSelect, height = 320 }) {
  const position = recyclers.length
    ? [recyclers[0].latitude, recyclers[0].longitude]
    : [KISUMU_CENTER.lat, KISUMU_CENTER.lng]

  return (
    <div className="map-container" style={{ height, marginBottom: 12 }}>
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {recyclers.map((rc) => (
          <Marker
            key={rc.id}
            position={[rc.latitude, rc.longitude]}
            icon={leafIcon(rc.id === selectedId ? '#dc2626' : rc.accepts_type === false ? '#64748b' : '#0f766e')}
            eventHandlers={{ click: () => onSelect?.(rc) }}
          >
            <Popup>
              <strong>{rc.name}</strong>
              {rc.distance_km !== undefined && <div className="muted">{rc.distance_km.toFixed(1)} km away</div>}
              {rc.address && <div className="muted">{rc.address}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
