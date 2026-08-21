export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function required(value, field = 'This field') {
  if (value === undefined || value === null || `${value}`.trim() === '') {
    return `${field} is required`
  }
  return ''
}

export function validateEmail(value, field = 'Email') {
  if (required(value, field)) {
    return required(value, field)
  }
  if (!isEmail(value)) {
    return 'Enter a valid email address'
  }
  return ''
}

export function validateName(value) {
  return required(value, 'Name')
}

export function validatePassword(value) {
  if (!value || value.length < 6) {
    return 'Password must be at least 6 characters'
  }
  return ''
}

export function validatePasswordMatch(password, confirm) {
  if (password !== confirm) {
    return 'Passwords do not match'
  }
  return ''
}

export function validateNumber(value, { field = 'Value', min, max, required: isRequired = true } = {}) {
  if (isRequired && required(value, field)) {
    return required(value, field)
  }
  const num = Number(value)
  if (Number.isNaN(num)) {
    return `${field} must be a number`
  }
  if (min !== undefined && num < min) {
    return `${field} must be at least ${min}`
  }
  if (max !== undefined && num > max) {
    return `${field} must be at most ${max}`
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

export function validateSignup(input) {
  for (const err of [
    validateName(input?.name),
    validateEmail(input?.email),
    validatePassword(input?.password),
    validatePasswordMatch(input?.password, input?.confirm),
  ]) {
    if (err) {
      return err
    }
  }
  return ''
}

export function validateInviteCode(value) {
  return required(value, 'Invite code')
}

export function validateAdminSignup(input) {
  for (const err of [
    validateName(input?.name),
    validateEmail(input?.email),
    validatePassword(input?.password),
    validatePasswordMatch(input?.password, input?.confirm),
    validateInviteCode(input?.inviteCode),
  ]) {
    if (err) {
      return err
    }
  }
  return ''
}

export function validateWastePoint(input) {
  for (const err of [
    required(input?.name, 'Name'),
    validateNumber(input?.latitude, { field: 'Latitude', min: -90, max: 90 }),
    validateNumber(input?.longitude, { field: 'Longitude', min: -180, max: 180 }),
    validateNumber(input?.current_level_pct, { field: 'Level', min: 0, max: 100 }),
  ]) {
    if (err) {
      return err
    }
  }
  return ''
}

export function validateTruck(input) {
  for (const err of [
    required(input?.registration_number, 'Registration number'),
    validateNumber(input?.capacity_kg, { field: 'Capacity', min: 1 }),
  ]) {
    if (err) {
      return err
    }
  }
  return ''
}
