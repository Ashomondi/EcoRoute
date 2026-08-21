import { STATUS_LABELS } from '../../utils/constants'

/**
 * @param {{ status: import('../../types/wastePoint').WastePoint['status'] }} props
 */
export default function WasteStatus({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>
}
