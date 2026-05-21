import { describe, it, expect } from 'vitest'
import { formatMass } from '../formatters'

describe('formatMass', () => {
  it('returns — for null', () => {
    expect(formatMass(null)).toBe('—')
  })

  it('formats petagram range', () => {
    expect(formatMass(2e15)).toBe('2.00 Pg')
  })

  it('formats teragram range', () => {
    expect(formatMass(3.5e12)).toBe('3.50 Tg')
  })

  it('formats gigagram range', () => {
    expect(formatMass(1.2e9)).toBe('1.20 Gg')
  })

  it('formats megagram range', () => {
    expect(formatMass(5e6)).toBe('5.00 Mg')
  })

  it('formats small values in scientific notation', () => {
    expect(formatMass(500)).toMatch(/^5\.00e\+2 kg$/)
  })
})
