import { describe, expect, it } from 'vitest'
import {
  isEmail,
  required,
  validateEmail,
  validateNumber,
  validatePassword,
  validatePasswordMatch,
  validateReport,
  validateSignup,
  validateTruck,
  validateWastePoint,
} from './validators'

describe('validators', () => {
  it('validates emails', () => {
    expect(isEmail('jane@example.com')).toBe(true)
    expect(isEmail('not-an-email')).toBe(false)
    expect(isEmail('')).toBe(false)
  })

  it('validates required fields', () => {
    expect(required('')).toBe('This field is required')
    expect(required(undefined, 'Name')).toBe('Name is required')
    expect(required('value')).toBe('')
  })

  it('validates email fields', () => {
    expect(validateEmail('')).toBe('Email is required')
    expect(validateEmail('nope')).toBe('Enter a valid email address')
    expect(validateEmail('jane@example.com')).toBe('')
  })

  it('validates password length', () => {
    expect(validatePassword('abc')).toBe('Password must be at least 6 characters')
    expect(validatePassword('abcdef')).toBe('')
    expect(validatePassword('')).toBe('Password must be at least 6 characters')
  })

  it('validates password match', () => {
    expect(validatePasswordMatch('abc', 'abd')).toBe('Passwords do not match')
    expect(validatePasswordMatch('abc', 'abc')).toBe('')
  })

  it('validates numbers', () => {
    expect(validateNumber('abc')).toBe('Value must be a number')
    expect(validateNumber('', { field: 'Level' })).toBe('Level is required')
    expect(validateNumber('-1', { field: 'Level', min: 0 })).toBe('Level must be at least 0')
    expect(validateNumber('101', { field: 'Level', max: 100 })).toBe('Level must be at most 100')
    expect(validateNumber('50', { field: 'Level', min: 0, max: 100 })).toBe('')
  })

  it('validates report input', () => {
    expect(validateReport({})).toBe('Select a problem type')
    expect(validateReport({ problemType: 'overflow' })).toBe('')
    expect(
      validateReport({ problemType: 'overflow', description: 'x'.repeat(501) }),
    ).toBe('Description is too long (max 500 characters)')
  })

  it('validates signup input', () => {
    expect(validateSignup({ name: '', email: 'a@b.co', password: 'abcdef', confirm: 'abcdef' })).toBe(
      'Name is required',
    )
    expect(
      validateSignup({ name: 'Jane', email: 'bad', password: 'abcdef', confirm: 'abcdef' }),
    ).toBe('Enter a valid email address')
    expect(
      validateSignup({ name: 'Jane', email: 'a@b.co', password: 'abcdef', confirm: 'abcdeg' }),
    ).toBe('Passwords do not match')
    expect(
      validateSignup({ name: 'Jane', email: 'a@b.co', password: 'abcdef', confirm: 'abcdef' }),
    ).toBe('')
  })

  it('validates waste point input', () => {
    expect(validateWastePoint({})).toBe('Name is required')
    expect(validateWastePoint({ name: 'A', latitude: 200 })).toBe('Latitude must be at most 90')
    expect(
      validateWastePoint({ name: 'A', latitude: -0.1, longitude: 34.7, current_level_pct: 50 }),
    ).toBe('')
  })

  it('validates truck input', () => {
    expect(validateTruck({})).toBe('Registration number is required')
    expect(validateTruck({ registration_number: 'KCA 1A', capacity_kg: 0 })).toBe(
      'Capacity must be at least 1',
    )
    expect(validateTruck({ registration_number: 'KCA 1A', capacity_kg: 5000 })).toBe('')
  })
})
