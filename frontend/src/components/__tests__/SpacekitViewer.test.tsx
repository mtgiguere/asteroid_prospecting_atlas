import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { SpacekitViewer } from '../SpacekitViewer'
import type { SolarSystemViewerHandle } from '../SpacekitViewer'
import type { AsteroidOrbit } from '../../types'

const mockCanvas = document.createElement('canvas')
const mockControls = {
  target: { set: vi.fn() },
  update: vi.fn(),
  enableDamping: true,
  enableDamping_calls: [] as string[],
}
const mockCamera = {
  position: { set: vi.fn() },
  lookAt: vi.fn(),
  projectionMatrix: { elements: new Array(16).fill(0) },
  matrixWorldInverse: { elements: new Array(16).fill(0) },
}
const mockSpaceObject = { getPosition: vi.fn().mockReturnValue([50, 30, 5]) }

vi.mock('spacekit.js', () => {
  class MockSimulation {
    createStars = vi.fn()
    createSphere = vi.fn().mockReturnValue(mockSpaceObject)
    createObject = vi.fn().mockReturnValue(mockSpaceObject)
    removeObject = vi.fn()
    setJd = vi.fn()
    getJd = vi.fn().mockReturnValue(2451545.0)
    getScene = vi.fn().mockReturnValue({ children: [] })
    getViewer = vi.fn().mockReturnValue({
      get3jsCamera: () => mockCamera,
      get3jsCameraControls: () => mockControls,
    })
    getRenderer = vi.fn().mockReturnValue({ domElement: mockCanvas })
    stop = vi.fn()
  }
  class MockEphem {}
  return { Simulation: MockSimulation, Ephem: MockEphem }
})

const asteroid: AsteroidOrbit = {
  asteroid_id: 1,
  name: 'Test Rock',
  nasa_jpl_id: '2000001',
  absolute_magnitude_h: 18.0,
  estimated_diameter_km: 0.5,
  albedo: 0.15,
  spectral_type: 'S',
  epoch_mjd: 51544.0,
  semi_major_axis_au: 1.5,
  eccentricity: 0.3,
  inclination_deg: 5.0,
  longitude_of_ascending_node_deg: 90.0,
  argument_of_periapsis_deg: 180.0,
  mean_anomaly_deg: 45.0,
  orbital_period_days: 670.0,
  perihelion_au: 1.05,
  aphelion_au: 1.95,
  earth_orbit_crossing: false,
  accessibility_score: 0.7,
  prospecting_score: 0.8,
  resource_profile: {
    type_group: 'S',
    type_label: 'Silicaceous',
    primary_resources: ['Nickel', 'Iron'],
    estimated_mass_kg: 1e12,
    water_mass_kg: null,
    metal_mass_kg: 5e11,
    pgm_mass_kg: 1e8,
    why_go_here: 'Rich in metals.',
  },
}

const baseProps = {
  asteroids: [asteroid],
  selectedId: null,
  hoveredId: null,
  colorMode: 'spectral_type' as const,
  currentMjd: 51544.0,
  onSelect: vi.fn(),
  onHover: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

describe('SpacekitViewer', () => {
  it('renders a container div', () => {
    render(<SpacekitViewer {...baseProps} />)
    expect(screen.getByTestId('spacekit-container')).toBeInTheDocument()
  })

  it('unmounts without throwing', () => {
    const { unmount } = render(<SpacekitViewer {...baseProps} />)
    expect(() => unmount()).not.toThrow()
  })

  it('renders with empty asteroid list', () => {
    render(<SpacekitViewer {...baseProps} asteroids={[]} />)
    expect(screen.getByTestId('spacekit-container')).toBeInTheDocument()
  })
})

describe('SpacekitViewer flyTo', () => {
  it('calls controls.update twice when flying to an asteroid (double-flush pattern)', () => {
    const ref = createRef<SolarSystemViewerHandle>()
    render(<SpacekitViewer {...baseProps} ref={ref} />)
    ref.current?.flyTo({ kind: 'asteroid', asteroid })
    expect(mockControls.update).toHaveBeenCalledTimes(2)
  })

  it('disables then re-enables damping when flying to an asteroid', () => {
    const dampingSequence: boolean[] = []
    const originalDesc = Object.getOwnPropertyDescriptor(mockControls, 'enableDamping')
    let dampingValue = true
    Object.defineProperty(mockControls, 'enableDamping', {
      get: () => dampingValue,
      set: (v: boolean) => { dampingValue = v; dampingSequence.push(v) },
      configurable: true,
    })
    mockControls.update = vi.fn()
    const ref = createRef<SolarSystemViewerHandle>()
    render(<SpacekitViewer {...baseProps} ref={ref} />)
    ref.current?.flyTo({ kind: 'asteroid', asteroid })
    expect(dampingSequence).toContain(false)
    expect(dampingValue).toBe(true)
    if (originalDesc) Object.defineProperty(mockControls, 'enableDamping', originalDesc)
  })

  it('sets camera position when flying to sol', () => {
    const ref = createRef<SolarSystemViewerHandle>()
    render(<SpacekitViewer {...baseProps} ref={ref} />)
    ref.current?.flyTo({ kind: 'sol' })
    expect(mockCamera.position.set).toHaveBeenCalled()
    expect(mockControls.update).toHaveBeenCalled()
  })
})
