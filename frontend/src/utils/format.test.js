import { describe, expect, it } from 'vitest'
import { formatDateTime, formatKm, formatKg, formatNumber, formatPct, timeAgo, titleCase } from './format'

describe('format', () => {
  it('formats numbers with fixed digits', () => {
    expect(formatNumber(12.345)).toBe('12')
    expect(formatNumber(12.345, 1)).toBe('12.3')
    expect(formatNumber(12.345, 2)).toBe('12.35')
    expect(formatNumber()).toBe('0')
  })

  it('formats km', () => {
    expect(formatKm(12.345)).toBe('12.3 km')
    expect(formatKm()).toBe('0.0 km')
  })

  it('formats kg', () => {
    expect(formatKg(42)).toBe('42 kg')
  })

  it('formats percent', () => {
    expect(formatPct(88.4)).toBe('88%')
    expect(formatPct(0)).toBe('0%')
  })

  it('formats date-time', () => {
    expect(formatDateTime('2026-08-21T09:15:00Z')).toContain('2026')
    expect(formatDateTime(null)).toBe('—')
  })

  it('titleCases snake_case', () => {
    expect(titleCase('en_route')).toBe('En Route')
    expect(titleCase('')).toBe('')
  })

  it('timeAgo handles absent and recent', () => {
    expect(timeAgo(null)).toBe('—')
    expect(timeAgo(new Date().toISOString())).toBe('just now')
  })
})
