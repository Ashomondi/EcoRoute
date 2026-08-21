export const ROLE_LABELS = {
  admin: 'Admin',
  driver: 'Driver',
  community: 'Resident',
}

export const STATUS_LABELS = {
  ok: 'Healthy',
  warning: 'Nearing capacity',
  critical: 'Critical',
}

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const REPORT_STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

export const TRUCK_STATUS_LABELS = {
  idle: 'Idle',
  en_route: 'En route',
  full: 'Full',
  maintenance: 'Maintenance',
}

export const ROUTE_STATUS_LABELS = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
}

export const PROBLEM_TYPE_LABELS = {
  overflow: 'Overflowing bin',
  illegal_dumping: 'Illegal dumping',
  missed_collection: 'Missed collection',
  other: 'Other',
}

export const PROBLEM_TYPES = [
  { value: 'overflow', label: 'Overflowing bin' },
  { value: 'illegal_dumping', label: 'Illegal dumping' },
  { value: 'missed_collection', label: 'Missed collection' },
  { value: 'other', label: 'Other' },
]
