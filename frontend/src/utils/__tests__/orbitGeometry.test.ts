import { describe, it, expect, vi } from 'vitest'
import { hohmannTransferPoints, AU_M } from '../orbitGeometry'

// Cesium requires a full WebGL context — mock just the Cartesian3 we need
vi.mock('cesium', () => ({
  Cartesian3: class {
    x: number; y: number; z: number
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z }
  },
}))

describe('hohmannTransferPoints', () => {
  it('returns numPoints+1 positions', () => {
    const pts = hohmannTransferPoints(0, 2.0)
    expect(pts).toHaveLength(61) // default numPoints=60
  })

  it('respects custom numPoints', () => {
    const pts = hohmannTransferPoints(0, 2.0, 30)
    expect(pts).toHaveLength(31)
  })

  it('all points have z=0 (ecliptic plane transfer)', () => {
    const pts = hohmannTransferPoints(45, 1.5, 60)
    for (const p of pts) {
      expect(p.z).toBeCloseTo(0, 10)
    }
  })

  it('all points have x, y, z numeric properties', () => {
    const pts = hohmannTransferPoints(0, 2.0)
    for (const p of pts) {
      expect(typeof p.x).toBe('number')
      expect(typeof p.y).toBe('number')
      expect(typeof p.z).toBe('number')
    }
  })

  it('first point is at ~1 AU from origin (Earth orbit radius)', () => {
    const pts = hohmannTransferPoints(0, 2.0)
    const r = Math.sqrt(pts[0].x ** 2 + pts[0].y ** 2)
    expect(r / AU_M).toBeCloseTo(1.0, 3)
  })

  it('first point direction matches earthLonDeg=0 (positive x axis)', () => {
    const pts = hohmannTransferPoints(0, 2.0)
    expect(pts[0].x / AU_M).toBeCloseTo(1.0, 3)
    expect(pts[0].y / AU_M).toBeCloseTo(0.0, 3)
  })

  it('first point direction matches earthLonDeg=90 (positive y axis)', () => {
    const pts = hohmannTransferPoints(90, 2.0)
    expect(pts[0].x / AU_M).toBeCloseTo(0.0, 3)
    expect(pts[0].y / AU_M).toBeCloseTo(1.0, 3)
  })

  it('last point is at asteroid SMA distance', () => {
    const sma = 2.5
    const pts = hohmannTransferPoints(0, sma)
    const r = Math.sqrt(pts[pts.length - 1].x ** 2 + pts[pts.length - 1].y ** 2)
    expect(r / AU_M).toBeCloseTo(sma, 3)
  })

  it('last point is on the opposite side of the Sun from Earth (lon=0)', () => {
    const pts = hohmannTransferPoints(0, 2.0)
    const last = pts[pts.length - 1]
    expect(last.x).toBeLessThan(0)
    expect(last.y / AU_M).toBeCloseTo(0.0, 3)
  })
})
