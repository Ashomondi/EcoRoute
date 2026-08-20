export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validatePassword(value) {
  if (!value || value.length < 6) {
    return 'Password must be at least 6 characters'
  }
  return ''
}

export function validateReport(input) {
  if (!input?.problemType) {
    return 'Select a problem type'
  }
  if (input.description && input.description.length > 500) {
    return 'Description is too long (max 500 characters)'
  }
  return ''
}
