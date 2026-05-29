import { describe, it, expect } from 'vitest'
import { suggestCompanions, additionalDeltaV, resourceSynergy } from '../missionCompanions'
import type { AsteroidOrbit } from '../../types'

// ── fixtures ───────────────────────────────────────────────────────────────────

const BASE_ROI = {
  resource_value_usd: 1e12,
  resource_value_label: '$1.0T',
  reach_rating: 'MODERATE',
  reach_summary: '~55% of launch mass must be propellant',
  mission_grade: 'STRONG',
  summary: 'Good target.',
  cost_tiers: {
    flyby:         { cost_usd: 300_000_000, cost_label: '$300.0M', roi_ratio: 3333.3, roi_label: '3333.3x return' },
    rendezvous:    { cost_usd: 800_000_000, cost_label: '$800.0M', roi_ratio: 1250.0, roi_label: '1250.0x return' },
    sample_return: { cost_usd: 2_000_000_000, cost_label: '$2.0B', roi_ratio: 500.0, roi_label: '500.0x return' },
    recommended: 'sample_return' as const,
  },
}

const BASE_WINDOW = {
  days_until_window: 300,
  transit_days: 259,
  synodic_period_days: 780,
  launch_date: '2026-04-01',
  arrival_date: '2026-12-17',
  window_label: 'Opens in 10m',
  repeat_label: 'Repeats every 2.1 years',
}

const BASE_PROFILE = {
  type_group: 'S',
  type_label: 'Silicaceous',
  primary_resources: ['Iron', 'Nickel'],
  estimated_mass_kg: 1e15,
  water_mass_kg: 0,
  metal_mass_kg: 2.5e14,
  pgm_mass_kg: 1e10,
  why_go_here: 'Metals.',
}

function makeAsteroid(overrides: Partial<AsteroidOrbit> = {}): AsteroidOrbit {
  return {
    asteroid_id: 1,
    name: 'Test Rock',
    nasa_jpl_id: '1000001',
    absolute_magnitude_h: 15,
    estimated_diameter_km: 1.0,
    albedo: 0.2,
    spectral_type: 'S',
    epoch_mjd: 60200,
    semi_major_axis_au: 1.5,
    eccentricity: 0.2,
    inclination_deg: 5,
    longitude_of_ascending_node_deg: 100,
    argument_of_periapsis_deg: 80,
    mean_anomaly_deg: 45,
    orbital_period_days: 670,
    perihelion_au: 1.2,
    aphelion_au: 1.8,
    earth_orbit_crossing: false,
    delta_v_kms: 5.0,
    accessibility_score: 5.0,
    prospecting_score: 1.0,
    resource_profile: { ...BASE_PROFILE },
    launch_window: { ...BASE_WINDOW },
    mission_roi: { ...BASE_ROI },
    ...overrides,
  }
}

// ── additionalDeltaV ──────────────────────────────────────────────────────────

describe('additionalDeltaV', () => {
  it('is zero when target and companion have identical orbital parameters', () => {
    const a = makeAsteroid({ delta_v_kms: 4.0, inclination_deg: 5 })
    expect(additionalDeltaV(a, a)).toBeCloseTo(0, 2)
  })

  it('increases with delta-v difference', () => {
    const target    = makeAsteroid({ delta_v_kms: 4.0, inclination_deg: 5 })
    const near      = makeAsteroid({ delta_v_kms: 4.5, inclination_deg: 5 })
    const far       = makeAsteroid({ delta_v_kms: 7.0, inclination_deg: 5 })
    expect(additionalDeltaV(target, near)).toBeLessThan(additionalDeltaV(target, far))
  })

  it('increases with inclination difference', () => {
    const target      = makeAsteroid({ delta_v_kms: 4.0, inclination_deg: 2 })
    const lowInc      = makeAsteroid({ delta_v_kms: 4.0, inclination_deg: 4 })
    const highInc     = makeAsteroid({ delta_v_kms: 4.0, inclination_deg: 20 })
    expect(additionalDeltaV(target, lowInc)).toBeLessThan(additionalDeltaV(target, highInc))
  })

  it('returns a non-negative number', () => {
    const a = makeAsteroid({ delta_v_kms: 6.0, inclination_deg: 10 })
    const b = makeAsteroid({ delta_v_kms: 3.0, inclination_deg: 2 })
    expect(additionalDeltaV(a, b)).toBeGreaterThanOrEqual(0)
  })
})

// ── resourceSynergy ───────────────────────────────────────────────────────────

describe('resourceSynergy', () => {
  it('C + M is the highest-synergy pairing', () => {
    const c = makeAsteroid({ resource_profile: { ...BASE_PROFILE, type_group: 'C' } })
    const m = makeAsteroid({ resource_profile: { ...BASE_PROFILE, type_group: 'M' } })
    expect(resourceSynergy(c, m)).toBeGreaterThan(0)
  })

  it('C + S has synergy', () => {
    const c = makeAsteroid({ resource_profile: { ...BASE_PROFILE, type_group: 'C' } })
    const s = makeAsteroid({ resource_profile: { ...BASE_PROFILE, type_group: 'S' } })
    expect(resourceSynergy(c, s)).toBeGreaterThan(0)
  })

  it('same type has no synergy', () => {
    const s1 = makeAsteroid({ resource_profile: { ...BASE_PROFILE, type_group: 'S' } })
    const s2 = makeAsteroid({ resource_profile: { ...BASE_PROFILE, type_group: 'S' } })
    expect(resourceSynergy(s1, s2)).toBe(0)
  })

  it('C + M synergy exceeds C + S synergy', () => {
    const c  = makeAsteroid({ resource_profile: { ...BASE_PROFILE, type_group: 'C' } })
    const m  = makeAsteroid({ resource_profile: { ...BASE_PROFILE, type_group: 'M' } })
    const s  = makeAsteroid({ resource_profile: { ...BASE_PROFILE, type_group: 'S' } })
    expect(resourceSynergy(c, m)).toBeGreaterThan(resourceSynergy(c, s))
  })
})

// ── suggestCompanions ─────────────────────────────────────────────────────────

describe('suggestCompanions', () => {
  it('returns at most n companions', () => {
    const target = makeAsteroid({ nasa_jpl_id: '1' })
    const pool = [
      makeAsteroid({ nasa_jpl_id: '2', name: 'Rock B', delta_v_kms: 5.2 }),
      makeAsteroid({ nasa_jpl_id: '3', name: 'Rock C', delta_v_kms: 5.4 }),
      makeAsteroid({ nasa_jpl_id: '4', name: 'Rock D', delta_v_kms: 5.6 }),
    ]
    const result = suggestCompanions(target, [target, ...pool], 2)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('never includes the target itself', () => {
    const target = makeAsteroid({ nasa_jpl_id: '1' })
    const pool = [
      target,
      makeAsteroid({ nasa_jpl_id: '2', name: 'Rock B', delta_v_kms: 5.1 }),
    ]
    const result = suggestCompanions(target, pool, 2)
    expect(result.find((r) => r.asteroid.nasa_jpl_id === '1')).toBeUndefined()
  })

  it('ranks lower additional delta-v first', () => {
    const target = makeAsteroid({ nasa_jpl_id: '1', delta_v_kms: 4.0, inclination_deg: 5 })
    const near   = makeAsteroid({ nasa_jpl_id: '2', name: 'Near',  delta_v_kms: 4.3, inclination_deg: 5 })
    const far    = makeAsteroid({ nasa_jpl_id: '3', name: 'Far',   delta_v_kms: 8.0, inclination_deg: 5 })
    const result = suggestCompanions(target, [target, near, far], 2)
    expect(result[0].asteroid.nasa_jpl_id).toBe('2')
  })

  it('prefers a complementary type over a same-type with equal delta-v', () => {
    const target = makeAsteroid({
      nasa_jpl_id: '1',
      delta_v_kms: 4.0,
      inclination_deg: 5,
      resource_profile: { ...BASE_PROFILE, type_group: 'S' },
    })
    const sameType = makeAsteroid({
      nasa_jpl_id: '2',
      name: 'Same Type',
      delta_v_kms: 4.1,
      inclination_deg: 5,
      resource_profile: { ...BASE_PROFILE, type_group: 'S' },
    })
    const complement = makeAsteroid({
      nasa_jpl_id: '3',
      name: 'Complement',
      delta_v_kms: 4.1,
      inclination_deg: 5,
      resource_profile: { ...BASE_PROFILE, type_group: 'C' },
    })
    const result = suggestCompanions(target, [target, sameType, complement], 2)
    expect(result[0].asteroid.nasa_jpl_id).toBe('3')
  })

  it('each suggestion includes additional_dv_kms and rationale', () => {
    const target = makeAsteroid({ nasa_jpl_id: '1' })
    const other  = makeAsteroid({ nasa_jpl_id: '2', name: 'Other', delta_v_kms: 5.3 })
    const result = suggestCompanions(target, [target, other], 1)
    expect(result[0].additional_dv_kms).toBeGreaterThanOrEqual(0)
    expect(typeof result[0].rationale).toBe('string')
    expect(result[0].rationale.length).toBeGreaterThan(0)
  })

  it('returns empty array when no other asteroids exist', () => {
    const target = makeAsteroid({ nasa_jpl_id: '1' })
    expect(suggestCompanions(target, [target], 2)).toHaveLength(0)
  })
})
