import { formatKm } from '../../utils/format'

function Bar({ label, baseline, optimized, baselineLabel, optimizedLabel }) {
  const max = Math.max(baseline, optimized, 1)
  return (
    <div className="compare-row">
      <span className="row-label">{label}</span>
      <div className="compare-track">
        <div className="impact-fill" style={{ width: `${Math.round((optimized / max) * 100)}%` }} />
      </div>
      <div className="landing-compare-vals">
        <span className="landing-before">{baselineLabel}</span>
        <span className="landing-after">{optimizedLabel}</span>
      </div>
    </div>
  )
}

export default function OptimizationResult({ result }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Optimization result</h3>
        <span className="badge badge-medium">−{formatKm(result.distance_saved_km)} saved</span>
      </div>
      <p className="sub">Nearest-neighbour + 2-opt route vs the naive ordering.</p>
      <div className="compare-bar">
        <Bar
          label="Distance"
          baseline={result.baseline_distance_km}
          optimized={result.distance_km}
          baselineLabel={`${formatKm(result.baseline_distance_km)} baseline`}
          optimizedLabel={`${formatKm(result.distance_km)} optimized`}
        />
        <Bar
          label="Fuel"
          baseline={result.baseline_fuel_l}
          optimized={result.estimated_fuel_l}
          baselineLabel={`${result.baseline_fuel_l} L`}
          optimizedLabel={`${result.estimated_fuel_l} L`}
        />
        <Bar
          label="Time"
          baseline={result.baseline_minutes}
          optimized={result.estimated_minutes}
          baselineLabel={`${result.baseline_minutes} min`}
          optimizedLabel={`${result.estimated_minutes} min`}
        />
      </div>
      <div className="landing-impact-foot">
        <span>
          Fuel saved <strong>{result.fuel_saved_l.toFixed(1)} L</strong>
        </span>
        <span>
          Time saved <strong>{result.time_saved_minutes} min</strong>
        </span>
      </div>
    </div>
  )
}
