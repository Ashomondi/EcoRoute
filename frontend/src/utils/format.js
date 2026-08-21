export function formatNumber(value, digits = 0) {
  const n = Number(value || 0)
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export function formatKg(value) {
  const n = Number(value || 0)
  if (n >= 1000) return `${formatNumber(n / 1000, 1)} t`
  return `${formatNumber(n, 0)} kg`
}

export function formatKm(value) {
  const n = Number(value || 0)
  if (n >= 10) return `${formatNumber(n, 0)} km`
  return `${formatNumber(n, 1)} km`
}

export function formatPercent(value) {
  return `${formatNumber(value)}%`
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

export function levelColor(level) {
  if (level >= 85) return 'var(--danger)'
  if (level >= 60) return 'var(--warning)'
  return 'var(--success)'
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}
