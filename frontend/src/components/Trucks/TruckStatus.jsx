import { TRUCK_STATUS_LABELS } from '../../utils/constants'

export default function TruckStatus({ status }) {
  return <span className={`badge badge-${status === 'idle' ? 'active' : status === 'en_route' ? 'warning' : status === 'full' ? 'critical' : 'medium'}`}>
    {TRUCK_STATUS_LABELS[status] || status}
  </span>
}
