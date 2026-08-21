export const ROLES = {
  ADMIN: 'admin',
  DRIVER: 'driver',
  COMMUNITY: 'community',
}

export const ROLE_LABELS = {
  admin: 'Admin',
  driver: 'Driver',
  community: 'Community',
}

export const WASTE_STATUS = {
  OK: 'ok',
  WARNING: 'warning',
  CRITICAL: 'critical',
}

export const WASTE_STATUS_LABELS = {
  ok: 'OK',
  warning: 'Warning',
  critical: 'Critical',
}

export const TRUCK_STATUS_LABELS = {
  idle: 'Idle',
  en_route: 'En Route',
  full: 'Full',
  maintenance: 'Maintenance',
}

export const ROUTE_STATUS_LABELS = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
}

export const REPORT_STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export const REPORT_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const PROBLEM_TYPE_LABELS = {
  overflow: 'Overflow',
  illegal_dumping: 'Illegal Dumping',
  missed_collection: 'Missed Collection',
  other: 'Other',
}

export const COLLECT_THRESHOLD_PCT = 85
export const WARNING_THRESHOLD_PCT = 60

export const DEMO_ACCOUNTS = [
  { role: 'admin', email: 'admin@ecoroute.dev', password: 'admin123', label: 'Admin' },
  { role: 'driver', email: 'driver@ecoroute.dev', password: 'driver123', label: 'Driver' },
  { role: 'community', email: 'community@ecoroute.dev', password: 'community123', label: 'Community' },
  { role: 'seller', email: 'seller@ecoroute.dev', password: 'seller123', label: 'Seller' },
]

export const MARKET_CATEGORIES = [
  { slug: 'plastic', label: 'Plastic', emoji: '♻️' },
  { slug: 'paper', label: 'Paper', emoji: '📦' },
  { slug: 'glass', label: 'Glass', emoji: '🍾' },
  { slug: 'organic', label: 'Organic', emoji: '🌱' },
  { slug: 'wood', label: 'Wood', emoji: '🪵' },
  { slug: 'textile', label: 'Textile', emoji: '👕' },
  { slug: 'metal', label: 'Metal', emoji: '🔩' },
  { slug: 'other', label: 'Other', emoji: '📦' },
]

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
