import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from './StatCard'

describe('StatCard', () => {
  it('renders label, value and unit', () => {
    render(<StatCard label="Fuel saved" value="4.2" unit="L" />)
    expect(screen.getByText('Fuel saved')).toBeTruthy()
    expect(screen.getByText('4.2')).toBeTruthy()
    expect(screen.getByText('L')).toBeTruthy()
  })

  it('renders an optional sub-note', () => {
    render(<StatCard label="Routes" value="3" sub="this week" />)
    expect(screen.getByText('this week')).toBeTruthy()
  })
})
