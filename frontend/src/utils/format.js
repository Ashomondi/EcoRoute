export function formatNumber(n, digits = 0) {
  return (n ?? 0).toFixed(digits)
}

export function formatKm(km) {
  return `${formatNumber(km, 1)} km`
}

export function formatKg(kg) {
  return `${formatNumber(kg)} kg`
}

export function formatPct(pct) {
  return `${Math.round(pct ?? 0)}%`
}

export function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString() : '—'
}

export function formatDateTime(iso) {
  return iso ? new Date(iso).toLocaleString() : '—'
}

export function timeAgo(iso) {
  if (!iso) {
    return '—'
  }
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) {
    return 'just now'
  }
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }
  return `${Math.floor(hours / 24)}d ago`
}

export function titleCase(str = '') {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
