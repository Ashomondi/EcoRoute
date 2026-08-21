import { TRUCK_STATUS_LABELS } from '../../utils/constants'

/**
 * @param {{ status: import('../../types/truck').Truck['status'] }} props
 */
export default function TruckStatus({ status }) {
  const label = TRUCK_STATUS_LABELS[status] || status
  const cls =
    status === 'idle'
      ? 'badge-ok'
      : status === 'en_route'
        ? 'badge-active'
        : status === 'full'
          ? 'badge-critical'
          : 'badge-warning'

  return <span className={`badge ${cls}`}>{label}</span>
}
