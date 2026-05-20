type RGB = [number, number, number]

const GREEN: RGB = [0, 255, 140]
const YELLOW: RGB = [255, 210, 0]
const RED: RGB = [255, 50, 30]

function lerp(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

export function scoreToHex(score: number, minScore: number, maxScore: number): string {
  const range = maxScore - minScore
  const t = range === 0 ? 0 : Math.max(0, Math.min(1, (score - minScore) / range))
  const [r, g, b] = t < 0.5 ? lerp(GREEN, YELLOW, t * 2) : lerp(YELLOW, RED, (t - 0.5) * 2)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
