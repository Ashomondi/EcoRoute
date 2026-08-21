import { Polyline } from 'react-leaflet'

/**
 * @param {{
 *   route: import('../../types/wastePoint').WastePoint[],
 * }} props
 */
export default function RouteLine({ route }) {
  const positions = route.map((p) => [p.latitude, p.longitude])

  return <Polyline positions={positions} pathOptions={{ color: 'var(--primary)', weight: 3 }} />
}
