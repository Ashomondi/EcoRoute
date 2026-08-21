import { formatNumber } from '../../utils/format'

/**
 * @param {{
 *   route: import('../../types/route').Route,
 * }} props
 */
export default function RouteSummary({ route }) {
  if (!route) {
    return null
  }
  return (
    <div className="grid cols-3">
      <Mini label="Distance" value={formatNumber(route.distance_km, 1)} unit="km" />
      <Mini label="Est. time" value={formatNumber(route.estimated_minutes)} unit="min" />
      <Mini label="Est. fuel" value={formatNumber(route.estimated_fuel_l, 1)} unit="L" />
    </div>
  )
}

/**
 * @param {{
 *   label: string,
 *   value: string|number,
 *   unit?: string,
 * }} props
 */
function Mini({ label, value, unit }) {
  return (
    <div className="card stat-card">
      <p className="muted stat-label">{label}</p>
      <p className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </p>
    </div>
  )
}
