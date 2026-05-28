import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationSidebar } from '../NavigationSidebar'
import type { AsteroidOrbit } from '../../types'

const makeAsteroid = (overrides: Partial<AsteroidOrbit> = {}): AsteroidOrbit => ({
  asteroid_id: 1,
  name: '433 Eros (1898 DQ)',
  nasa_jpl_id: '2000433',
  absolute_magnitude_h: 10.31,
  estimated_diameter_km: 16.84,
  albedo: 0.25,
  spectral_type: 'S',
  epoch_mjd: 60200.5,
  semi_major_axis_au: 1.458,
  eccentricity: 0.223,
  inclination_deg: 10.83,
  longitude_of_ascending_node_deg: 304.4,
  argument_of_periapsis_deg: 178.7,
  mean_anomaly_deg: 42.1,
  orbital_period_days: 643.2,
  perihelion_au: 1.133,
  aphelion_au: 1.783,
  earth_orbit_crossing: false,
  delta_v_kms: 4.8,
  accessibility_score: 4.8,
  prospecting_score: 0.8,
  mission_roi: {
    resource_value_usd: 2.5e12,
    resource_value_label: '$2.5T',
    reach_rating: 'MODERATE',
    reach_summary: '~67% of launch mass must be propellant',
    mission_grade: 'STRONG',
    summary: 'High-value iron, nickel, and silicates, within practical mission range.',
    cost_tiers: {
      flyby:         { cost_usd: 300_000_000,   cost_label: '$300.0M', roi_ratio: 8333.3, roi_label: '8333.3x return' },
      rendezvous:    { cost_usd: 800_000_000,   cost_label: '$800.0M', roi_ratio: 3125.0, roi_label: '3125.0x return' },
      sample_return: { cost_usd: 2_000_000_000, cost_label: '$2.0B',   roi_ratio: 1250.0, roi_label: '1250.0x return' },
      recommended: 'sample_return',
    },
  },
  resource_profile: {
    type_group: 'S',
    type_label: 'Silicaceous (S-type)',
    primary_resources: ['Iron', 'Nickel'],
    estimated_mass_kg: 1e15,
    water_mass_kg: 0,
    metal_mass_kg: 2.5e14,
    pgm_mass_kg: 1e10,
    why_go_here: 'Iron and nickel for orbital construction.',
  },
  launch_window: {
    days_until_window: 312.0,
    transit_days: 259.0,
    synodic_period_days: 780.0,
    launch_date: '2026-04-02',
    arrival_date: '2026-12-17',
    window_label: 'Opens in 10m',
    repeat_label: 'Windows repeat every 2.1 years',
  },
  ...overrides,
})

const YORP = makeAsteroid({
  asteroid_id: 2,
  name: '54509 YORP (2000 PH5)',
  nasa_jpl_id: '20054509',
  semi_major_axis_au: 1.006,
  prospecting_score: 0.33,
})

const C_TYPE = makeAsteroid({
  asteroid_id: 3,
  name: '101955 Bennu',
  nasa_jpl_id: '2101955',
  resource_profile: {
    type_group: 'C',
    type_label: 'Carbonaceous (C-type)',
    primary_resources: ['Water', 'Organics'],
    estimated_mass_kg: 7.3e10,
    water_mass_kg: 1e9,
    metal_mass_kg: 0,
    pgm_mass_kg: 0,
    why_go_here: 'Water ice for fuel.',
  },
})

const M_TYPE = makeAsteroid({
  asteroid_id: 4,
  name: '16 Psyche',
  nasa_jpl_id: '2000016',
  resource_profile: {
    type_group: 'M',
    type_label: 'Metallic (M-type)',
    primary_resources: ['Iron', 'Nickel', 'Platinum'],
    estimated_mass_kg: 2.27e19,
    water_mass_kg: 0,
    metal_mass_kg: 2e19,
    pgm_mass_kg: 1e15,
    why_go_here: 'Enormous metal reserves.',
  },
})

describe('NavigationSidebar', () => {
  it('renders Sol', () => {
    render(<NavigationSidebar asteroids={[]} onFlyTo={vi.fn()} />)
    expect(screen.getByText(/sol/i)).toBeInTheDocument()
  })

  it('renders all five planets', () => {
    render(<NavigationSidebar asteroids={[]} onFlyTo={vi.fn()} />)
    expect(screen.getByText(/mercury/i)).toBeInTheDocument()
    expect(screen.getByText(/venus/i)).toBeInTheDocument()
    expect(screen.getByText(/earth/i)).toBeInTheDocument()
    expect(screen.getByText(/mars/i)).toBeInTheDocument()
    expect(screen.getByText(/jupiter/i)).toBeInTheDocument()
  })

  it('renders asteroid names', () => {
    render(<NavigationSidebar asteroids={[makeAsteroid(), YORP]} onFlyTo={vi.fn()} />)
    expect(screen.getByText(/433 Eros/i)).toBeInTheDocument()
    expect(screen.getByText(/YORP/i)).toBeInTheDocument()
  })

  it('filters asteroids by search query', async () => {
    render(<NavigationSidebar asteroids={[makeAsteroid(), YORP]} onFlyTo={vi.fn()} />)
    await userEvent.type(screen.getByRole('searchbox'), 'YORP')
    expect(screen.queryByText(/433 Eros/i)).not.toBeInTheDocument()
    expect(screen.getByText(/YORP/i)).toBeInTheDocument()
  })

  it('shows all asteroids again when search is cleared', async () => {
    render(<NavigationSidebar asteroids={[makeAsteroid(), YORP]} onFlyTo={vi.fn()} />)
    const input = screen.getByRole('searchbox')
    await userEvent.type(input, 'YORP')
    await userEvent.clear(input)
    expect(screen.getByText(/433 Eros/i)).toBeInTheDocument()
    expect(screen.getByText(/YORP/i)).toBeInTheDocument()
  })

  it('calls onFlyTo with sol when Sol is clicked', async () => {
    const onFlyTo = vi.fn()
    render(<NavigationSidebar asteroids={[]} onFlyTo={onFlyTo} />)
    await userEvent.click(screen.getByText(/sol/i))
    expect(onFlyTo).toHaveBeenCalledWith({ kind: 'sol' })
  })

  it('calls onFlyTo with planet target when a planet is clicked', async () => {
    const onFlyTo = vi.fn()
    render(<NavigationSidebar asteroids={[]} onFlyTo={onFlyTo} />)
    await userEvent.click(screen.getByText(/earth/i))
    expect(onFlyTo).toHaveBeenCalledWith({ kind: 'planet', planetId: 'earth' })
  })

  it('calls onFlyTo with asteroid target when an asteroid is clicked', async () => {
    const onFlyTo = vi.fn()
    const eros = makeAsteroid()
    render(<NavigationSidebar asteroids={[eros]} onFlyTo={onFlyTo} />)
    await userEvent.click(screen.getByText(/433 Eros/i))
    expect(onFlyTo).toHaveBeenCalledWith({ kind: 'asteroid', asteroid: eros })
  })

  it('shows asteroid count', () => {
    render(<NavigationSidebar asteroids={[makeAsteroid(), YORP]} onFlyTo={vi.fn()} />)
    expect(screen.getByText(/2 bodies/i)).toBeInTheDocument()
  })

  it('calls onHover with asteroid id on mouseenter', async () => {
    const onHover = vi.fn()
    const eros = makeAsteroid()
    render(<NavigationSidebar asteroids={[eros]} onFlyTo={vi.fn()} onHover={onHover} />)
    await userEvent.hover(screen.getByText(/433 Eros/i))
    expect(onHover).toHaveBeenCalledWith('2000433')
  })

  it('calls onHover with null on mouseleave', async () => {
    const onHover = vi.fn()
    const eros = makeAsteroid()
    render(<NavigationSidebar asteroids={[eros]} onFlyTo={vi.fn()} onHover={onHover} />)
    await userEvent.hover(screen.getByText(/433 Eros/i))
    await userEvent.unhover(screen.getByText(/433 Eros/i))
    expect(onHover).toHaveBeenLastCalledWith(null)
  })

  describe('resource filter', () => {
    const all = [makeAsteroid(), C_TYPE, M_TYPE]

    it('renders All, Water, Metals, PGMs filter buttons', () => {
      render(<NavigationSidebar asteroids={all} onFlyTo={vi.fn()} />)
      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /water/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /metals/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pgms/i })).toBeInTheDocument()
    })

    it('shows all asteroids by default', () => {
      render(<NavigationSidebar asteroids={all} onFlyTo={vi.fn()} />)
      expect(screen.getByText(/433 Eros/i)).toBeInTheDocument()
      expect(screen.getByText(/Bennu/i)).toBeInTheDocument()
      expect(screen.getByText(/Psyche/i)).toBeInTheDocument()
    })

    it('Water filter shows only C-type asteroids', async () => {
      render(<NavigationSidebar asteroids={all} onFlyTo={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /water/i }))
      expect(screen.queryByText(/433 Eros/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Bennu/i)).toBeInTheDocument()
      expect(screen.queryByText(/Psyche/i)).not.toBeInTheDocument()
    })

    it('Metals filter shows S-type and M-type asteroids', async () => {
      render(<NavigationSidebar asteroids={all} onFlyTo={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /metals/i }))
      expect(screen.getByText(/433 Eros/i)).toBeInTheDocument()
      expect(screen.queryByText(/Bennu/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Psyche/i)).toBeInTheDocument()
    })

    it('PGMs filter shows only M-type asteroids', async () => {
      render(<NavigationSidebar asteroids={all} onFlyTo={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /pgms/i }))
      expect(screen.queryByText(/433 Eros/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Bennu/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Psyche/i)).toBeInTheDocument()
    })

    it('All button resets filter to show all asteroids', async () => {
      render(<NavigationSidebar asteroids={all} onFlyTo={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /water/i }))
      await userEvent.click(screen.getByRole('button', { name: /all/i }))
      expect(screen.getByText(/433 Eros/i)).toBeInTheDocument()
      expect(screen.getByText(/Bennu/i)).toBeInTheDocument()
      expect(screen.getByText(/Psyche/i)).toBeInTheDocument()
    })

    it('resource filter and name search apply together', async () => {
      const eros2 = makeAsteroid({ asteroid_id: 5, name: 'Eros Clone', nasa_jpl_id: '9999999' })
      render(<NavigationSidebar asteroids={[makeAsteroid(), eros2, C_TYPE]} onFlyTo={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /metals/i }))
      await userEvent.type(screen.getByRole('searchbox'), 'Clone')
      expect(screen.queryByText(/433 Eros/i)).not.toBeInTheDocument()
      expect(screen.getByText(/Eros Clone/i)).toBeInTheDocument()
      expect(screen.queryByText(/Bennu/i)).not.toBeInTheDocument()
    })
  })

  describe('sort', () => {
    // LOW_DV: easiest to reach, worst prospecting score, name sorts last
    const LOW_DV = makeAsteroid({
      asteroid_id: 10,
      name: 'Zeta Rock',
      nasa_jpl_id: '1000001',
      delta_v_kms: 2.1,
      accessibility_score: 2.1,
      prospecting_score: 0.9,
    })
    // HIGH_DV: hardest to reach, best prospecting score, name sorts first
    const HIGH_DV = makeAsteroid({
      asteroid_id: 11,
      name: 'Alpha Stone',
      nasa_jpl_id: '1000002',
      delta_v_kms: 8.5,
      accessibility_score: 8.5,
      prospecting_score: 0.2,
    })
    const pair = [LOW_DV, HIGH_DV]

    function asteroidNames() {
      return screen.getAllByTestId('asteroid-list-item').map((el) => el.textContent ?? '')
    }

    it('renders Score, Delta-v, and Name sort buttons', () => {
      render(<NavigationSidebar asteroids={pair} onFlyTo={vi.fn()} />)
      expect(screen.getByRole('button', { name: /score/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delta-v/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /name/i })).toBeInTheDocument()
    })

    it('default sort is by prospecting score ascending — best score first', () => {
      render(<NavigationSidebar asteroids={pair} onFlyTo={vi.fn()} />)
      const names = asteroidNames()
      expect(names[0]).toMatch(/Alpha Stone/)
      expect(names[1]).toMatch(/Zeta Rock/)
    })

    it('Delta-v sort puts lowest delta-v first', async () => {
      render(<NavigationSidebar asteroids={pair} onFlyTo={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /delta-v/i }))
      const names = asteroidNames()
      expect(names[0]).toMatch(/Zeta Rock/)
      expect(names[1]).toMatch(/Alpha Stone/)
    })

    it('Name sort puts asteroids in alphabetical order', async () => {
      render(<NavigationSidebar asteroids={pair} onFlyTo={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /name/i }))
      const names = asteroidNames()
      expect(names[0]).toMatch(/Alpha Stone/)
      expect(names[1]).toMatch(/Zeta Rock/)
    })

    it('active sort button has aria-pressed true', async () => {
      render(<NavigationSidebar asteroids={pair} onFlyTo={vi.fn()} />)
      expect(screen.getByRole('button', { name: /score/i })).toHaveAttribute('aria-pressed', 'true')
      await userEvent.click(screen.getByRole('button', { name: /delta-v/i }))
      expect(screen.getByRole('button', { name: /delta-v/i })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: /score/i })).toHaveAttribute('aria-pressed', 'false')
    })

    it('sort and resource filter apply together', async () => {
      const metalA = makeAsteroid({ asteroid_id: 20, name: 'Iron Alpha', nasa_jpl_id: '2000020', delta_v_kms: 5.0, prospecting_score: 0.5 })
      const metalB = makeAsteroid({ asteroid_id: 21, name: 'Iron Zeta',  nasa_jpl_id: '2000021', delta_v_kms: 3.0, prospecting_score: 0.7 })
      render(<NavigationSidebar asteroids={[metalA, metalB, C_TYPE]} onFlyTo={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /metals/i }))
      await userEvent.click(screen.getByRole('button', { name: /delta-v/i }))
      expect(screen.queryByText(/Bennu/i)).not.toBeInTheDocument()
      const names = asteroidNames()
      expect(names[0]).toMatch(/Iron Zeta/)
      expect(names[1]).toMatch(/Iron Alpha/)
    })

    it('sort resets correctly when switching back to Score', async () => {
      render(<NavigationSidebar asteroids={pair} onFlyTo={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /delta-v/i }))
      await userEvent.click(screen.getByRole('button', { name: /score/i }))
      const names = asteroidNames()
      expect(names[0]).toMatch(/Alpha Stone/)
    })
  })
})
