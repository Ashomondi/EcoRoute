import TruckStatus from './TruckStatus'

export default function TruckCard({ truck }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{truck.registration_number}</h3>
        <TruckStatus status={truck.status} />
      </div>
      <p className="muted">
        Capacity: {truck.capacity_kg} kg
        <br />
        Driver: {truck.driver_id ? 'Assigned' : 'Unassigned'}
      </p>
    </div>
  )
}
