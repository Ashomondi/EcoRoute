export default function TruckStatus({ status }) {
  const label = status.replace('_', ' ')
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
