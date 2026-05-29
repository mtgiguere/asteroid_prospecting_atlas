import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComparisonPanel } from '../ComparisonPanel'
import type { AsteroidOrbit } from '../../types'

const makeAsteroid = (overrides: Partial<AsteroidOrbit>): AsteroidOrbit => ({
  asteroid_id: 1,
  name: 'Asteroid Alpha',
  nasa_jpl_id: '2000001',
  absolute_magnitude_h: 18,
  estimated_diameter_km: 2.0,
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
  accessibility_score: 0.8,
  prospecting_score: 0.9,
  mission_roi: {
    resource_value_usd: 5e12,
    resource_value_label: '$5T',
    reach_rating: 'MODERATE',
    reach_summary: '~60% of launch mass must be propellant',
    mission_grade: 'EXCEPTIONAL',
    summary: 'Rich in metals',
    cost_tiers: {
      flyby:         { cost_usd: 3e8, cost_label: '$300M', roi_ratio: 16666, roi_label: '16666x' },
      rendezvous:    { cost_usd: 8e8, cost_label: '$800M', roi_ratio: 6250,  roi_label: '6250x'  },
      sample_return: { cost_usd: 2e9, cost_label: '$2B',   roi_ratio: 2500,  roi_label: '2500x'  },
      recommended: 'sample_return',
    },
  },
  resource_profile: {
    type_group: 'S',
    type_label: 'Silicaceous',
    primary_resources: ['Iron', 'Nickel'],
    estimated_mass_kg: 1e14,
    water_mass_kg: null,
    metal_mass_kg: 2.5e13,
    pgm_mass_kg: 1e9,
    why_go_here: 'Rich in metals',
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
  ...overrides,
})

const asteroidA = makeAsteroid({
  name: 'Asteroid Alpha',
  nasa_jpl_id: '2000001',
  mission_roi: {
    resource_value_usd: 5e12,
    resource_value_label: '$5T',
    reach_rating: 'MODERATE',
    reach_summary: '~60% of launch mass must be propellant',
    mission_grade: 'EXCEPTIONAL',
    summary: 'Rich in metals',
    cost_tiers: {
      flyby:         { cost_usd: 3e8, cost_label: '$300M', roi_ratio: 16666, roi_label: '16666x' },
      rendezvous:    { cost_usd: 8e8, cost_label: '$800M', roi_ratio: 6250,  roi_label: '6250x'  },
      sample_return: { cost_usd: 2e9, cost_label: '$2B',   roi_ratio: 2500,  roi_label: '2500x'  },
      recommended: 'sample_return',
    },
  },
  delta_v_kms: 6.5,
})

const asteroidB = makeAsteroid({
  name: 'Asteroid Beta',
  nasa_jpl_id: '2000002',
  mission_roi: {
    resource_value_usd: 8e11,
    resource_value_label: '$800B',
    reach_rating: 'EASY REACH',
    reach_summary: '~45% of launch mass must be propellant',
    mission_grade: 'STRONG',
    summary: 'Accessible target',
    cost_tiers: {
      flyby:         { cost_usd: 3e8, cost_label: '$300M', roi_ratio: 2666, roi_label: '2666x' },
      rendezvous:    { cost_usd: 8e8, cost_label: '$800M', roi_ratio: 1000, roi_label: '1000x' },
      sample_return: { cost_usd: 2e9, cost_label: '$2B',   roi_ratio: 400,  roi_label: '400x'  },
      recommended: 'sample_return',
    },
  },
  delta_v_kms: 3.2,
})

const baseProps = {
  asteroidA,
  asteroidB,
  onClose: vi.fn(),
}

describe('ComparisonPanel', () => {
  it('renders both asteroid names', () => {
    render(<ComparisonPanel {...baseProps} />)
    expect(screen.getAllByText('Asteroid Alpha').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Asteroid Beta').length).toBeGreaterThan(0)
  })

  it('renders resource value labels for both asteroids', () => {
    render(<ComparisonPanel {...baseProps} />)
    expect(screen.getByText('$5T')).toBeInTheDocument()
    expect(screen.getByText('$800B')).toBeInTheDocument()
  })

  it('renders mission grade for both asteroids', () => {
    render(<ComparisonPanel {...baseProps} />)
    expect(screen.getByText('EXCEPTIONAL')).toBeInTheDocument()
    expect(screen.getByText('STRONG')).toBeInTheDocument()
  })

  it('renders reach rating for both asteroids', () => {
    render(<ComparisonPanel {...baseProps} />)
    expect(screen.getByText('MODERATE')).toBeInTheDocument()
    expect(screen.getByText('EASY REACH')).toBeInTheDocument()
  })

  it('marks the higher resource value as winner', () => {
    render(<ComparisonPanel {...baseProps} />)
    // asteroidA has higher resource value ($5T vs $800B)
    expect(screen.getByTestId('winner-resource-a')).toBeInTheDocument()
    expect(screen.queryByTestId('winner-resource-b')).not.toBeInTheDocument()
  })

  it('marks the lower delta-v as winner (easier to reach)', () => {
    render(<ComparisonPanel {...baseProps} />)
    // asteroidB has lower delta-v (3.2 vs 6.5 km/s)
    expect(screen.getByTestId('winner-deltav-b')).toBeInTheDocument()
    expect(screen.queryByTestId('winner-deltav-a')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<ComparisonPanel {...baseProps} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
