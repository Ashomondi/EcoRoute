import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import WasteMarker from './WasteMarker'
import RouteLine from './RouteLine'

const KISUMU = [-0.1022, 34.7617]

/**
 * @param {{
 *   points?: import('../../types/wastePoint').WastePoint[],
 *   route?: import('../../types/wastePoint').WastePoint[],
 *   onSelectPoint?: (point: import('../../types/wastePoint').WastePoint) => void,
 *   center?: [number, number],
 *   zoom?: number,
 *   height?: string,
 * }} props
 */
export default function WasteMap({ points = [], route, onSelectPoint, center, zoom, height }) {
  return (
    <div className="map-container" style={{ height: height || '420px' }}>
      <MapContainer
        center={center || KISUMU}
        zoom={zoom || 12}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {points.map((p) => (
          <WasteMarker key={p.id} point={p} onClick={onSelectPoint} />
        ))}
        {route && route.length > 1 && <RouteLine route={route} />}
      </MapContainer>
    </div>
  )
}
