/**
 * @param {{
 *   level: number,
 *   status: import('../../types/wastePoint').WastePoint['status'],
 * }} props
 */
export default function WasteLevelIndicator({ level, status }) {
  const color =
    status === 'critical' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : 'var(--success)'

  return (
    <div className="level-bar">
      <div style={{ width: `${Math.max(0, Math.min(100, level))}%`, background: color }} />
    </div>
  )
}
