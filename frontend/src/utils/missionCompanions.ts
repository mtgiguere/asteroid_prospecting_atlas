import type { AsteroidOrbit } from '../types'

export interface CompanionSuggestion {
  asteroid: AsteroidOrbit
  additional_dv_kms: number
  rationale: string
}

// Synergy matrix: which type-group pairings add mission value.
// C-type brings water (propellant feedstock); M-type brings high-value PGMs.
const SYNERGY: Record<string, Record<string, number>> = {
  C: { S: 0.4, M: 0.6, X: 0.3, C: 0 },
  S: { C: 0.4, M: 0.3, X: 0.2, S: 0 },
  M: { C: 0.6, S: 0.3, X: 0.2, M: 0 },
  X: { C: 0.3, S: 0.2, M: 0.2, X: 0 },
}

/**
 * Estimated additional delta-v (km/s) to add a companion to a mission
 * already targeting `target`. Uses the difference in heliocentric delta-v
 * plus an inclination-change penalty (~0.05 km/s per degree).
 */
export function additionalDeltaV(target: AsteroidOrbit, companion: AsteroidOrbit): number {
  const dvDiff = Math.abs(target.delta_v_kms - companion.delta_v_kms)
  const incDiff = Math.abs(target.inclination_deg - companion.inclination_deg)
  const incPenalty = incDiff * 0.05
  return dvDiff + incPenalty
}

/**
 * Resource synergy score [0, 1] for pairing two asteroids.
 * Higher = more complementary resource types.
 */
export function resourceSynergy(a: AsteroidOrbit, b: AsteroidOrbit): number {
  const ga = a.resource_profile?.type_group ?? 'unknown'
  const gb = b.resource_profile?.type_group ?? 'unknown'
  return SYNERGY[ga]?.[gb] ?? 0
}

function synergyRationale(target: AsteroidOrbit, companion: AsteroidOrbit): string {
  const gt = target.resource_profile?.type_group ?? '?'
  const gc = companion.resource_profile?.type_group ?? '?'
  if ((gt === 'C' && gc === 'M') || (gt === 'M' && gc === 'C'))
    return 'C+M pairing: water for propellant refuel, platinum-group metals for value.'
  if ((gt === 'C' && gc === 'S') || (gt === 'S' && gc === 'C'))
    return 'C+S pairing: water ice and iron-nickel — full ISRU resource set.'
  if ((gt === 'S' && gc === 'M') || (gt === 'M' && gc === 'S'))
    return 'S+M pairing: silicates and high-value metals in one sweep.'
  if (gt === gc)
    return `Both ${gc}-type — same resource class, minimal extra cost to sequence.`
  return 'Similar orbital neighborhood — low incremental delta-v.'
}

/**
 * Given a target asteroid and the full loaded catalog, return the top `n`
 * companion suggestions ranked by net mission score (lower extra delta-v
 * and higher resource synergy = better).
 */
export function suggestCompanions(
  target: AsteroidOrbit,
  allAsteroids: AsteroidOrbit[],
  n = 2,
): CompanionSuggestion[] {
  const candidates = allAsteroids.filter((a) => a.nasa_jpl_id !== target.nasa_jpl_id)

  const scored = candidates.map((companion) => {
    const extraDv = additionalDeltaV(target, companion)
    const synergy = resourceSynergy(target, companion)
    // Lower score = better companion. Synergy subtracts up to 0.6 km/s equivalent.
    const score = extraDv - synergy
    return { asteroid: companion, additional_dv_kms: Math.round(extraDv * 100) / 100, score, rationale: '' }
  })

  scored.sort((a, b) => a.score - b.score)

  return scored.slice(0, n).map(({ asteroid, additional_dv_kms }) => ({
    asteroid,
    additional_dv_kms,
    rationale: synergyRationale(target, asteroid),
  }))
}
