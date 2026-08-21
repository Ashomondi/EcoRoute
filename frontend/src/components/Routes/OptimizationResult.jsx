import { formatNumber, formatPct, titleCase } from '../../utils/format'

/**
 * @param {{
 *   result: import('../../types/route').OptimizationResult,
 * }} props
 */
export default function OptimizationResult({ result }) {
  if (!result) {
    return null
  }
  return (
    <div>
      <div className="grid cols-4" style={{ marginBottom: 16 }}>
        <Mini label="Optimized" value={formatNumber(result.distance_km, 1)} unit="km" />
        <Mini label="Baseline" value={formatNumber(result.baseline_distance_km, 1)} unit="km" />
        <Mini label="Distance saved" value={formatNumber(result.distance_saved_km, 1)} unit="km" />
        <Mini label="Fuel saved" value={formatNumber(result.fuel_saved_l, 1)} unit="L" />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Optimized stops</h3>
        {result.stops.length === 0 ? (
          <p className="empty">No points need collection for this truck.</p>
        ) : (
          <ol className="stop-list">
            {result.stops.map((s) => (
              <li key={s.waste_point.id}>
                <strong>{s.order}.</strong> {s.waste_point.name} — {formatPct(s.waste_point.current_level_pct)}
                <span className={`badge badge-${s.waste_point.status}`} style={{ marginLeft: 8 }}>
                  {titleCase(s.waste_point.status)}
                </span>
              </li>
            ))}
          </ol>
        )}
        {result.time_saved_minutes > 0 && (
          <p className="muted" style={{ marginTop: 12 }}>
            ~{formatNumber(result.time_saved_minutes)} minutes faster than the naive order.
          </p>
        )}
      </div>
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
