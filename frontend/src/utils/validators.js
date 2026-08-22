export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function required(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'This field is required'
  }
  return ''
}

export function validEmail(value) {
  if (required(value)) return required(value)
  if (!EMAIL_RE.test(String(value))) return 'Enter a valid email address'
  return ''
}

export function validPassword(value) {
  if (required(value)) return required(value)
  if (String(value).length < 6) return 'Password must be at least 6 characters'
  return ''
}

export const validateEmail = validEmail
export const validatePassword = validPassword

export function validateSignup({ name, email, password, confirm }) {
  return required(name) || validEmail(email) || validPassword(password) || (password !== confirm ? 'Passwords do not match' : '')
}

export function validateAdminSignup({ name, email, password, confirm, inviteCode }) {
  return validateSignup({ name, email, password, confirm }) || required(inviteCode)
}

export function validNumber(value, { min, max, label = 'Value' } = {}) {
  const n = Number(value)
  if (value === undefined || value === null || value === '' || Number.isNaN(n)) {
    return `${label} must be a number`
  }
  if (min !== undefined && n < min) return `${label} must be at least ${min}`
  if (max !== undefined && n > max) return `${label} must be at most ${max}`
  return ''
}

export function validLatitude(value) {
  return validNumber(value, { min: -90, max: 90, label: 'Latitude' })
}

export function validLongitude(value) {
  return validNumber(value, { min: -180, max: 180, label: 'Longitude' })
}
