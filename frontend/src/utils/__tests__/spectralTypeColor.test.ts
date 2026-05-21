import { describe, it, expect } from 'vitest'
import { spectralTypeGroupToHex, SPECTRAL_TYPE_COLORS } from '../spectralTypeColor'

describe('spectralTypeGroupToHex', () => {
  it('returns a hex color string for C-type', () => {
    const hex = spectralTypeGroupToHex('C')
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns a hex color string for S-type', () => {
    const hex = spectralTypeGroupToHex('S')
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns a hex color string for M-type', () => {
    const hex = spectralTypeGroupToHex('M')
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('C, S, M have distinct colors', () => {
    const c = spectralTypeGroupToHex('C')
    const s = spectralTypeGroupToHex('S')
    const m = spectralTypeGroupToHex('M')
    expect(c).not.toBe(s)
    expect(s).not.toBe(m)
    expect(c).not.toBe(m)
  })

  it('returns fallback hex for unknown group', () => {
    const hex = spectralTypeGroupToHex('unknown')
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns fallback hex for null input', () => {
    const hex = spectralTypeGroupToHex(null)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns fallback hex for unrecognized group', () => {
    const hex = spectralTypeGroupToHex('other')
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('SPECTRAL_TYPE_COLORS exports an entry for every known group', () => {
    for (const group of ['C', 'S', 'M', 'X', 'other', 'unknown']) {
      expect(SPECTRAL_TYPE_COLORS).toHaveProperty(group)
    }
  })
})
