import { STATUS_LABELS } from '../../utils/constants'

export default function WasteStatus({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>
}
