import { describe, expect, it } from 'vitest'
import { isEmail, validatePassword, validateReport } from './validators'

describe('validators', () => {
  it('validates emails', () => {
    expect(isEmail('jane@example.com')).toBe(true)
    expect(isEmail('not-an-email')).toBe(false)
    expect(isEmail('')).toBe(false)
  })

  it('validates password length', () => {
    expect(validatePassword('abc')).toBe('Password must be at least 6 characters')
    expect(validatePassword('abcdef')).toBe('')
    expect(validatePassword('')).toBe('Password must be at least 6 characters')
  })

  it('validates report input', () => {
    expect(validateReport({})).toBe('Select a problem type')
    expect(validateReport({ problemType: 'overflow' })).toBe('')
    expect(
      validateReport({ problemType: 'overflow', description: 'x'.repeat(501) }),
    ).toBe('Description is too long (max 500 characters)')
  })
})
