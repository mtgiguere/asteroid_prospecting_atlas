import { describe, it, expect } from 'vitest'
import {
  solveKepler,
  positionAtMjd,
  mjdToDateString,
  dateToMjd,
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

describe('planetAngleDeg', () => {
  const J2000_MJD = 51544.5

  it('returns j2000AngleDeg unchanged at J2000 epoch', () => {
    expect(planetAngleDeg(100, 365.25, J2000_MJD)).toBeCloseTo(100, 5)
  })

  it('advances by 360° after exactly one period', () => {
    const start = planetAngleDeg(45, 365.25, J2000_MJD)
    const end   = planetAngleDeg(45, 365.25, J2000_MJD + 365.25)
    expect((end - start + 360) % 360).toBeCloseTo(0, 3)
  })

  it('advances by 180° after half a period', () => {
    const start = planetAngleDeg(0, 365.25, J2000_MJD)
    const end   = planetAngleDeg(0, 365.25, J2000_MJD + 365.25 / 2)
    expect(Math.abs(end - start - 180)).toBeLessThan(0.01)
  })

  it('returns angle in [0, 360)', () => {
    const a = planetAngleDeg(350, 365.25, J2000_MJD + 100)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThan(360)
  })
})
