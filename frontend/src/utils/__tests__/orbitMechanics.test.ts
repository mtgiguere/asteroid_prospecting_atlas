import { describe, it, expect } from 'vitest'
import {
  solveKepler,
  positionAtMjd,
  mjdToDateString,
  dateToMjd,
  earthRotationRad,
  planetAngleDeg,
  type OrbitalElements,
} from '../orbitMechanics'

const AU_M = 1.496e11

// Simple circular orbit in the ecliptic plane — gives exact analytical answers
const CIRCLE: OrbitalElements = {
  semiMajorAxisAu: 1.0,
  eccentricity: 0,
  inclinationDeg: 0,
  lonAscNodeDeg: 0,
  argPeriapsisDeg: 0,
  epochMjd: 51544.0,      // 2000-01-01
  meanAnomalyDeg: 0,
  periodDays: 365.25,
}

// Eccentric orbit at perihelion at epoch
const ECCENTRIC: OrbitalElements = {
  semiMajorAxisAu: 1.5,
  eccentricity: 0.3,
  inclinationDeg: 0,
  lonAscNodeDeg: 0,
  argPeriapsisDeg: 0,
  epochMjd: 51544.0,
  meanAnomalyDeg: 0,
  periodDays: 600,
}

describe('solveKepler', () => {
  it('returns 0 for M=0 regardless of eccentricity', () => {
    expect(solveKepler(0, 0.5)).toBeCloseTo(0, 10)
  })

  it('returns π for M=π (symmetric point)', () => {
    expect(solveKepler(Math.PI, 0.5)).toBeCloseTo(Math.PI, 10)
  })

  it('returns M for circular orbit (e=0)', () => {
    expect(solveKepler(1.2, 0)).toBeCloseTo(1.2, 10)
  })

  it('satisfies Kepler\'s equation for eccentric orbit', () => {
    const M = 1.0
    const e = 0.7
    const E = solveKepler(M, e)
    expect(Math.abs(M - (E - e * Math.sin(E)))).toBeLessThan(1e-9)
  })
})

describe('positionAtMjd', () => {
  it('returns finite x, y, z coordinates', () => {
    const pos = positionAtMjd(CIRCLE, 51544.0)
    expect(Number.isFinite(pos.x)).toBe(true)
    expect(Number.isFinite(pos.y)).toBe(true)
    expect(Number.isFinite(pos.z)).toBe(true)
  })

  it('returns same position after exactly one full period (circular)', () => {
    const p1 = positionAtMjd(CIRCLE, 51544.0)
    const p2 = positionAtMjd(CIRCLE, 51544.0 + 365.25)
    expect(Math.abs(p1.x - p2.x)).toBeLessThan(1e4)
    expect(Math.abs(p1.y - p2.y)).toBeLessThan(1e4)
    expect(Math.abs(p1.z)).toBeLessThan(1e4)
  })

  it('places circular orbit on the ecliptic (z≈0) at all times', () => {
    const pos = positionAtMjd(CIRCLE, 51544.0 + 100)
    expect(Math.abs(pos.z)).toBeLessThan(1e4)
  })

  it('places asteroid at perihelion distance when M=0 at epoch (eccentric)', () => {
    const pos = positionAtMjd(ECCENTRIC, 51544.0)
    const r_perihelion = ECCENTRIC.semiMajorAxisAu * (1 - ECCENTRIC.eccentricity) * AU_M
    const r = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2)
    expect(Math.abs(r - r_perihelion)).toBeLessThan(1e4)
  })

  it('places asteroid at aphelion distance half-period later (eccentric)', () => {
    const pos = positionAtMjd(ECCENTRIC, 51544.0 + 300)
    const r_aphelion = ECCENTRIC.semiMajorAxisAu * (1 + ECCENTRIC.eccentricity) * AU_M
    const r = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2)
    expect(Math.abs(r - r_aphelion)).toBeLessThan(1e4)
  })

  it('circular orbit radius stays at 1 AU at all dates', () => {
    for (const dt of [0, 91, 182, 273]) {
      const pos = positionAtMjd(CIRCLE, 51544.0 + dt)
      const r = Math.sqrt(pos.x ** 2 + pos.y ** 2)
      expect(Math.abs(r - AU_M)).toBeLessThan(1e5)
    }
  })
})

describe('mjdToDateString', () => {
  it('formats MJD 51544.0 as 2000-01-01', () => {
    expect(mjdToDateString(51544.0)).toBe('2000-01-01')
  })

  it('formats MJD 51910.0 as 2001-01-01', () => {
    expect(mjdToDateString(51910.0)).toBe('2001-01-01')
  })
})

describe('dateToMjd', () => {
  it('converts 2000-01-01 to MJD 51544.0', () => {
    expect(dateToMjd(new Date('2000-01-01T00:00:00Z'))).toBeCloseTo(51544.0, 5)
  })
})

describe('earthRotationRad', () => {
  it('returns 0 at MJD 0', () => {
    expect(earthRotationRad(0)).toBeCloseTo(0, 10)
  })

  it('returns π/2 after a quarter day', () => {
    expect(earthRotationRad(0.25)).toBeCloseTo(Math.PI / 2, 5)
  })

  it('returns π after half a day', () => {
    expect(earthRotationRad(0.5)).toBeCloseTo(Math.PI, 5)
  })

  it('completes a full rotation after one day', () => {
    expect(earthRotationRad(1) % (2 * Math.PI)).toBeCloseTo(0, 5)
  })

  it('produces a consistent angle for any MJD', () => {
    const angle = earthRotationRad(51544.0)
    expect(Number.isFinite(angle)).toBe(true)
  })
})

describe('planetAngleDeg', () => {
  const J2000 = 51544.5

  it('returns lonJ2000Deg unchanged at the J2000 epoch', () => {
    expect(planetAngleDeg(100.46, 365.25, J2000)).toBeCloseTo(100.46, 5)
  })

  it('advances by 360/period degrees per day', () => {
    const result = planetAngleDeg(0, 365.25, J2000 + 1)
    expect(result).toBeCloseTo(360 / 365.25, 4)
  })

  it('returns the same angle after exactly one orbital period', () => {
    const period = 365.25
    const result = planetAngleDeg(100.46, period, J2000 + period)
    expect(result).toBeCloseTo(100.46, 3)
  })

  it('always returns a value in [0, 360)', () => {
    // Starting angle close to 360 that will wrap past 360 after 100 days
    const result = planetAngleDeg(350, 365.25, J2000 + 100)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThan(360)
  })

  it('works for short-period planets (Mercury)', () => {
    // Mercury period ~88 days — two full orbits
    const result = planetAngleDeg(252.25, 87.969, J2000 + 2 * 87.969)
    expect(result).toBeCloseTo(252.25, 2)
  })

  it('works for long-period planets (Jupiter)', () => {
    const result = planetAngleDeg(34.40, 4332.59, J2000 + 1000)
    const expected = (34.40 + 1000 * 360 / 4332.59) % 360
    expect(result).toBeCloseTo(expected, 4)
  })
})
