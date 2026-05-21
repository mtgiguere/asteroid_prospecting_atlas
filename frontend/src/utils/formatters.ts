export function formatMass(kg: number | null): string {
  if (kg === null) return '—'
  if (kg >= 1e15) return `${(kg / 1e15).toFixed(2)} Pg`
  if (kg >= 1e12) return `${(kg / 1e12).toFixed(2)} Tg`
  if (kg >= 1e9) return `${(kg / 1e9).toFixed(2)} Gg`
  if (kg >= 1e6) return `${(kg / 1e6).toFixed(2)} Mg`
  return `${kg.toExponential(2)} kg`
}

// Reference baselines for human-scale equivalencies
const LUNAR_BASE_WATER_KG_PER_YR = 2.19e5  // 6-person crew, 100 L/person/day
const GLOBAL_STEEL_KG_PER_YR     = 1.9e12  // World Steel Association ~2023
const GLOBAL_PLATINUM_KG_PER_YR  = 5e5     // ~500 t/yr, WPIC estimate

type ResourceType = 'water' | 'metals' | 'pgms'

export function resourceEquivalency(type: ResourceType, kg: number | null): string | null {
  if (!kg) return null
  let years: number
  let reference: string
  if (type === 'water') {
    years = kg / LUNAR_BASE_WATER_KG_PER_YR
    reference = 'lunar base'
  } else if (type === 'metals') {
    years = kg / GLOBAL_STEEL_KG_PER_YR
    reference = 'global steel output'
  } else {
    years = kg / GLOBAL_PLATINUM_KG_PER_YR
    reference = 'global platinum mining'
  }
  const rounded = Math.round(years)
  if (rounded < 1) return null
  return `≈ ${rounded.toLocaleString()} yr${rounded === 1 ? '' : 's'} · ${reference}`
}
