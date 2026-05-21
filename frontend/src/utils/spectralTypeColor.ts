export const SPECTRAL_TYPE_COLORS: Record<string, string> = {
  C: '#4499ff',   // blue — carbonaceous, water-rich
  S: '#ffaa33',   // amber — silicaceous, rocky
  M: '#ccddee',   // silver-white — metallic
  X: '#cc77ff',   // purple — ambiguous composition
  other: '#778899',
  unknown: '#445566',
}

export function spectralTypeGroupToHex(typeGroup: string | null): string {
  if (typeGroup === null) return SPECTRAL_TYPE_COLORS.unknown
  return SPECTRAL_TYPE_COLORS[typeGroup] ?? SPECTRAL_TYPE_COLORS.other
}
