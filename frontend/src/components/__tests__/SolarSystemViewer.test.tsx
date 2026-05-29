import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRef } from 'react'
import { render, waitFor } from '@testing-library/react'
import { SolarSystemViewer } from '../SolarSystemViewer'
import type { SolarSystemViewerHandle } from '../SolarSystemViewer'
import { PLANETS } from '../../constants/solarSystem'
import { planetAngleDeg } from '../../utils/orbitMechanics'
import type { AsteroidOrbit } from '../../types'

const AU_M = 1.496e11

// ── Hoisted mocks (must be initialized before vi.mock hoisting) ────────────
const mockFlyToBoundingSphere = vi.hoisted(() => vi.fn())
const mockPointsAdd = vi.hoisted(() => vi.fn())

// ── Cesium mock ────────────────────────────────────────────────────────────
vi.mock('cesium', () => {
  class Cartesian3 {
    x: number; y: number; z: number
    static ZERO: Cartesian3
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z }
    static normalize(v: any, r: any) { return Object.assign(r, v) }
    static subtract(a: any, b: any, r: any) {
      r.x = a.x - b.x; r.y = a.y - b.y; r.z = a.z - b.z; return r
    }
  }
  Cartesian3.ZERO = new Cartesian3(0, 0, 0)

  class Cartesian2 { constructor(public x = 0, public y = 0) {} }

  const makeColor = () => {
    const c: any = {}
    c.withAlpha = () => c
    return c
  }
  class Color {
    static fromCssColorString = (_s: string) => makeColor()
    static BLACK = makeColor()
    static WHITE = makeColor()
    static TRANSPARENT = makeColor()
  }

  class LabelCollection { add = vi.fn() }
  const LabelStyle = { FILL_AND_OUTLINE: 1 }
  class PolylineCollection { add = vi.fn() }
  class PointPrimitiveCollection { add = mockPointsAdd }

  class ScreenSpaceEventHandler { setInputAction = vi.fn(); destroy = vi.fn() }
  const ScreenSpaceEventType = { LEFT_CLICK: 1, MOUSE_MOVE: 2 }

  const Material = { fromType: vi.fn().mockReturnValue({}), ColorType: 'Color' }

  class BoundingSphere { constructor(public center: any, public radius: number) {} }

  class Quaternion { static fromAxisAngle = vi.fn().mockReturnValue({}) }
  class Matrix3 { static fromQuaternion = vi.fn().mockReturnValue({}) }
  class Matrix4 {
    static fromRotationTranslation = vi.fn().mockReturnValue({})
    static fromTranslation = vi.fn().mockReturnValue({})
  }

  class EllipsoidGeometry { constructor(_o: any) {} }
  class GeometryInstance { constructor(public opts: any) {} }
  class Primitive {
    isDestroyed = () => false
    modelMatrix: any = null
    constructor(_o: any) {}
  }
  class PerInstanceColorAppearance {
    static VERTEX_FORMAT: any = {}
    constructor(_o: any) {}
  }
  const ColorGeometryInstanceAttribute = { fromColor: vi.fn().mockReturnValue({}) }
  const defined = (v: any) => v !== undefined && v !== null

  return {
    Cartesian3, Cartesian2, Color, LabelCollection, LabelStyle, PolylineCollection,
    PointPrimitiveCollection, ScreenSpaceEventHandler, ScreenSpaceEventType,
    Material, BoundingSphere, Quaternion, Matrix3, Matrix4,
    EllipsoidGeometry, GeometryInstance, Primitive, PerInstanceColorAppearance,
    ColorGeometryInstanceAttribute, defined,
  }
})

// ── Resium mock ────────────────────────────────────────────────────────────
vi.mock('resium', () => {
  const { forwardRef, useEffect, createElement } = require('react')
  return {
    Viewer: forwardRef((props: any, ref: any) => {
      useEffect(() => {
        const fakeScene = {
          globe: { show: true },
          skyAtmosphere: { show: true },
          backgroundColor: null,
          logarithmicDepthBuffer: false,
          primitives: { add: vi.fn().mockImplementation((p: any) => p), remove: vi.fn() },
          screenSpaceCameraController: { zoomFactor: 5.0, minimumZoomDistance: 1e9 },
          pick: vi.fn().mockReturnValue(undefined),
          canvas: document.createElement('canvas'),
          preRender: { addEventListener: vi.fn().mockReturnValue(() => {}) },
        }
        const fakeViewer = {
          scene: fakeScene,
          camera: { setView: vi.fn(), flyToBoundingSphere: mockFlyToBoundingSphere },
          cesiumWidget: { creditContainer: { setAttribute: vi.fn() } },
          isDestroyed: () => false,
        }
        if (typeof ref === 'function') ref({ cesiumElement: fakeViewer })
      }, [])
      return createElement('div', { 'data-testid': 'cesium-viewer' })
    }),
  }
})

// ── Shared fixture ─────────────────────────────────────────────────────────
const mockAsteroid: AsteroidOrbit = {
  asteroid_id: 1,
  name: 'Test Rock',
  nasa_jpl_id: '2000001',
  absolute_magnitude_h: 18,
  estimated_diameter_km: 0.5,
  albedo: 0.15,
  spectral_type: 'S',
  epoch_mjd: 51544.0,
  semi_major_axis_au: 2.5,
  eccentricity: 0.1,
  inclination_deg: 5,
  longitude_of_ascending_node_deg: 90,
  argument_of_periapsis_deg: 180,
  mean_anomaly_deg: 45,
  orbital_period_days: 1444,
  perihelion_au: 2.25,
  aphelion_au: 2.75,
  earth_orbit_crossing: false,
  delta_v_kms: 4.0,
  accessibility_score: 3.0,
  prospecting_score: 0.7,
  mission_roi: {
    resource_value_usd: 1e12,
    resource_value_label: '$1T',
    reach_rating: 'MODERATE',
    reach_summary: 'ok',
    mission_grade: 'STRONG',
    summary: 'good',
    cost_tiers: {
      flyby:         { cost_usd: 3e8, cost_label: '$300M', roi_ratio: 3333, roi_label: '3333x' },
      rendezvous:    { cost_usd: 8e8, cost_label: '$800M', roi_ratio: 1250, roi_label: '1250x' },
      sample_return: { cost_usd: 2e9, cost_label: '$2B',   roi_ratio: 500,  roi_label: '500x'  },
      recommended: 'sample_return',
    },
  },
  resource_profile: {
    type_group: 'S',
    type_label: 'Silicaceous',
    primary_resources: ['Nickel'],
    estimated_mass_kg: 1e12,
    water_mass_kg: null,
    metal_mass_kg: 5e11,
    pgm_mass_kg: null,
    why_go_here: 'metals',
  },
  launch_window: {
    days_until_window: 100,
    transit_days: 200,
    synodic_period_days: 800,
    launch_date: '2026-06-01',
    arrival_date: '2026-12-18',
    window_label: 'Opens in 3m',
    repeat_label: 'Every 2.2 years',
  },
}

const baseProps = {
  asteroids: [mockAsteroid],
  selectedId: null,
  hoveredId: null,
  colorMode: 'spectral_type' as const,
  currentMjd: 51544.5,
  onSelect: vi.fn(),
  onHover: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

// ── Bug 1: Sun at Cartesian3.ZERO is inside WGS84 ellipsoid (horizon culled) ──
describe('SolarSystemViewer Sun placement', () => {
  it('does not place Sun glow primitives at the exact origin (Cartesian3.ZERO causes horizon culling)', async () => {
    render(<SolarSystemViewer {...baseProps} />)
    await waitFor(() => expect(mockPointsAdd).toHaveBeenCalled())

    const atOrigin = mockPointsAdd.mock.calls.find(
      ([opts]: [any]) =>
        opts.position?.x === 0 && opts.position?.y === 0 && opts.position?.z === 0,
    )
    expect(atOrigin).toBeUndefined()
  })
})

// ── Bug 2: flyTo planet used planet.angleDeg (J2000 static) instead of current MJD ──
describe('SolarSystemViewer flyTo planet', () => {
  it('computes planet position from current MJD via planetAngleDeg, not static J2000 angleDeg', async () => {
    const ref = createRef<SolarSystemViewerHandle>()
    const earth = PLANETS.find((p) => p.id === 'earth')!

    // At J2000+263.3 d, Earth is ~0.1° (near positive-x axis).
    // With the bug, angleDeg=100.46° → x ≈ -0.183*AU_M (negative).
    // With the fix, planetAngleDeg → x ≈ +1.0*AU_M (positive).
    const testMjd = 51544.5 + 263.3

    render(<SolarSystemViewer {...baseProps} currentMjd={testMjd} ref={ref} />)
    await waitFor(() => expect(mockPointsAdd).toHaveBeenCalled())

    ref.current!.flyTo({ kind: 'planet', planetId: 'earth' })

    expect(mockFlyToBoundingSphere).toHaveBeenCalledOnce()
    const bs = mockFlyToBoundingSphere.mock.calls[0][0]

    const expectedDeg = planetAngleDeg(earth.angleDeg, earth.periodDays, testMjd)
    const expectedX = Math.cos((expectedDeg * Math.PI) / 180) * earth.sma * AU_M

    expect(bs.center.x).toBeCloseTo(expectedX, -8)
  })
})
