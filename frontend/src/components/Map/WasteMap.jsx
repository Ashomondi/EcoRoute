import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { KISUMU_CENTER } from '../../utils/constants'
import WasteMarker from './WasteMarker'
import RouteLine from './RouteLine'

export default function WasteMap({ wastePoints, routePoints, selectedPointId, onSelectPoint, height = 420 }) {
  return (
    <div className="map-container" style={{ height }}>
      <MapContainer
        center={[KISUMU_CENTER.lat, KISUMU_CENTER.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {wastePoints?.map((wp) => (
          <WasteMarker
            key={wp.id}
            point={wp}
            selected={wp.id === selectedPointId}
            onClick={onSelectPoint}
          />
        ))}
        {routePoints?.length > 1 && <RouteLine points={routePoints} showStops />}
      </MapContainer>
    </div>
  )
}
