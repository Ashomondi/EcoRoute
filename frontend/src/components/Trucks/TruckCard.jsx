import { formatKg } from '../../utils/format'
import TruckStatus from './TruckStatus'

export default function TruckCard({ truck, actions }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{truck.registration_number}</h3>
        <TruckStatus status={truck.status} />
      </div>
      <div className="stat-sub muted">
        Capacity: <strong>{formatKg(truck.capacity_kg)}</strong>
      </div>
      <div className="stat-sub muted">Driver: {truck.driver?.name || 'Unassigned'}</div>
      <div className="stat-sub muted">
        Location: {truck.current_lat.toFixed(4)}, {truck.current_lng.toFixed(4)}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>{actions}</div>}
    </div>
  )
}
