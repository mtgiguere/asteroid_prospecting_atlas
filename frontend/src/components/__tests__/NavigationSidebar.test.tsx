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
  accessibility_score: 1.2,
  prospecting_score: 0.8,
  ...overrides,
})

const YORP = makeAsteroid({
  asteroid_id: 2,
  name: '54509 YORP (2000 PH5)',
  nasa_jpl_id: '20054509',
  semi_major_axis_au: 1.006,
  prospecting_score: 0.33,
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
})
