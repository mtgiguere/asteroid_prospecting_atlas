export function formatMass(kg: number | null): string {
  if (kg === null) return '—'
  if (kg >= 1e15) return `${(kg / 1e15).toFixed(2)} Pg`
  if (kg >= 1e12) return `${(kg / 1e12).toFixed(2)} Tg`
  if (kg >= 1e9) return `${(kg / 1e9).toFixed(2)} Gg`
  if (kg >= 1e6) return `${(kg / 1e6).toFixed(2)} Mg`
  return `${kg.toExponential(2)} kg`
}
