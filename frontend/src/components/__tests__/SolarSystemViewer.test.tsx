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
const mockCameraFlyTo = vi.hoisted(() => vi.fn())
const mockPointsAdd = vi.hoisted(() => vi.fn())
const mockPolylineAdd = vi.hoisted(() => vi.fn())
const mockBillboardAdd = vi.hoisted(() => vi.fn())

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
  class PolylineCollection { add = mockPolylineAdd }
  class PointPrimitiveCollection { add = mockPointsAdd }
  class BillboardCollection { add = mockBillboardAdd }

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
    PointPrimitiveCollection, BillboardCollection, ScreenSpaceEventHandler, ScreenSpaceEventType,
    Material, BoundingSphere, Quaternion, Matrix3, Matrix4,
    EllipsoidGeometry, GeometryInstance, Primitive, PerInstanceColorAppearance,
    ColorGeometryInstanceAttribute, defined,
  }
})

// ── Resium mock ────────────────────────────────────────────────────────────
vi.mock('resium', async () => {
  const { forwardRef, useEffect, createElement } = await import('react')
  return {
    Viewer: forwardRef((_props: any, ref: any) => {
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
          camera: {
            setView: vi.fn(),
            flyToBoundingSphere: mockFlyToBoundingSphere,
            flyTo: mockCameraFlyTo,
          },
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
  accessibility_score: 3.0,
  prospecting_score: 0.7,
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

// ── Bug 1: Sun rendering — PointPrimitive core always present ──
describe('SolarSystemViewer Sun rendering', () => {
  it('renders Sun PointPrimitive at origin with disableDepthTestDistance so it is never clipped', async () => {
    render(<SolarSystemViewer {...baseProps} />)
    await waitFor(() => expect(mockPointsAdd).toHaveBeenCalled())
    const sunCall = mockPointsAdd.mock.calls[0]?.[0]
    expect(sunCall?.position).toBeDefined()
    expect(sunCall?.disableDepthTestDistance).toBe(Number.POSITIVE_INFINITY)
  })
})

// ── Bug 4: flyTo Sol used flyToBoundingSphere which positions camera off-axis ──
describe('SolarSystemViewer flyTo Sol', () => {
  it('positions camera directly above ecliptic looking down so Sun is dead-center', async () => {
    const ref = createRef<SolarSystemViewerHandle>()
    render(<SolarSystemViewer {...baseProps} ref={ref} />)
    await waitFor(() => expect(mockPointsAdd).toHaveBeenCalled())

    ref.current!.flyTo({ kind: 'sol' })

    expect(mockCameraFlyTo).toHaveBeenCalledOnce()
    const dest = mockCameraFlyTo.mock.calls[0][0].destination
    // Camera sits on the Z-axis directly above the ecliptic (x=0, y=0, z>0)
    expect(dest.x).toBe(0)
    expect(dest.y).toBe(0)
    expect(dest.z).toBeGreaterThan(0)
  })
})

// ── Bug 3: orbit ring PolylineCollection in one-time [viewer] effect is invisible ──
describe('SolarSystemViewer orbit rings', () => {
  it('re-adds orbit ring polylines when currentMjd changes (rings must live in [viewer, currentMjd] effect)', async () => {
    const { rerender } = render(<SolarSystemViewer {...baseProps} currentMjd={51544.5} />)
    await waitFor(() => expect(mockPolylineAdd).toHaveBeenCalled())
    vi.clearAllMocks()
    rerender(<SolarSystemViewer {...baseProps} currentMjd={51600} />)
    await waitFor(() => expect(mockPolylineAdd).toHaveBeenCalled())
  })
})

// ── Bug 2: flyTo planet used planet.angleDeg (J2000 static) instead of current MJD ──
describe('SolarSystemViewer flyTo planet', () => {
  it('computes planet position from current MJD via planetAngleDeg, not static J2000 angleDeg', async () => {
    const ref = createRef<SolarSystemViewerHandle>()
    const earth = PLANETS.find((p) => p.id === 'earth')!

    // At J2000+263.3 d, Earth is near positive-x axis (angle ≈ 359°).
    // With the bug (static angleDeg=100): x ≈ -0.174*AU_M (negative).
    // With the fix (planetAngleDeg): x ≈ +1.0*AU_M (positive).
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
