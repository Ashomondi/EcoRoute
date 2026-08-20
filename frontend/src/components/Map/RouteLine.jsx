import { Polyline } from 'react-leaflet'

export default function RouteLine({ route }) {
  if (!route || route.length < 2) {
    return null
  }
  const positions = route.map((p) => [p.latitude, p.longitude])
  return <Polyline positions={positions} pathOptions={{ color: '#0f766e', weight: 4 }} />
}
