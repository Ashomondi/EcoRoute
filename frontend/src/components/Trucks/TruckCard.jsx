import TruckStatus from './TruckStatus'
import { formatKg } from '../../utils/format'

/**
 * @param {{
 *   truck: import('../../types/truck').Truck,
 * }} props
 */
export default function TruckCard({ truck }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{truck.registration_number}</h3>
        <TruckStatus status={truck.status} />
      </div>
      <p className="muted">
        Capacity: {formatKg(truck.capacity_kg)}
        <br />
        Driver: {truck.driver_id ? 'Assigned' : 'Unassigned'}
      </p>
    </div>
  )
}
