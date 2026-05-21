import { describe, it, expect } from 'vitest'
import { formatMass, resourceEquivalency } from '../formatters'

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

describe('resourceEquivalency', () => {
  it('returns null for null mass', () => {
    expect(resourceEquivalency('water', null)).toBeNull()
  })

  it('returns null for zero mass', () => {
    expect(resourceEquivalency('water', 0)).toBeNull()
  })

  it('returns water equivalency referencing a lunar base', () => {
    expect(resourceEquivalency('water', 2.19e7)).toMatch(/lunar base/i)
  })

  it('returns metals equivalency referencing global steel', () => {
    expect(resourceEquivalency('metals', 1.9e13)).toMatch(/steel/i)
  })

  it('returns pgm equivalency referencing platinum mining', () => {
    expect(resourceEquivalency('pgms', 5e6)).toMatch(/platinum/i)
  })

  it('uses years unit', () => {
    expect(resourceEquivalency('water', 2.19e6)).toMatch(/yr/i)
  })

  it('rounds to whole years', () => {
    // 2.19e5 kg/yr baseline → 4.38e5 kg = exactly 2 years
    expect(resourceEquivalency('water', 4.38e5)).toMatch(/\b2\b/)
  })
})
