import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AsteroidInfoPanel } from '../AsteroidInfoPanel'
import type { AsteroidOrbit } from '../../types'

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
  accessibility_score: 0.6,
  prospecting_score: 0.7,
  mission_roi: {
    resource_value_usd: 1e12,
    resource_value_label: '$1T',
    reach_rating: 'MODERATE',
    reach_summary: '~60% of launch mass must be propellant',
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
  asteroid: mockAsteroid,
  allAsteroids: [mockAsteroid],
  onClose: vi.fn(),
  onSelectCompanion: vi.fn(),
}

describe('AsteroidInfoPanel compare button', () => {
  it('renders a compare button when onCompare is provided', () => {
    render(<AsteroidInfoPanel {...baseProps} onCompare={vi.fn()} />)
    expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument()
  })

  it('does not render a compare button when onCompare is not provided', () => {
    render(<AsteroidInfoPanel {...baseProps} />)
    expect(screen.queryByRole('button', { name: /compare/i })).not.toBeInTheDocument()
  })

  it('calls onCompare when the compare button is clicked', async () => {
    const onCompare = vi.fn()
    render(<AsteroidInfoPanel {...baseProps} onCompare={onCompare} />)
    await userEvent.click(screen.getByRole('button', { name: /compare/i }))
    expect(onCompare).toHaveBeenCalledOnce()
  })
})
