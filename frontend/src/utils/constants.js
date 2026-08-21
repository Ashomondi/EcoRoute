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
]

export const KISUMU_CENTER = { lat: -0.1022, lng: 34.7617 }

export const TOKEN_KEY = 'ecoroute_token'
export const USER_KEY = 'ecoroute_user'
