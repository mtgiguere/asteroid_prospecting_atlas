export const AU_M = 1.496e11

export interface OrbitalElements {
  semiMajorAxisAu: number
  eccentricity: number
  inclinationDeg: number
  lonAscNodeDeg: number
  argPeriapsisDeg: number
  epochMjd: number
  meanAnomalyDeg: number
  periodDays: number
}

// Newton-Raphson solver for Kepler's equation M = E - e*sin(E)
export function solveKepler(M: number, e: number, maxIter = 50, tol = 1e-10): number {
  let E = M
  for (let i = 0; i < maxIter; i++) {
    const dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E))
    E += dE
    if (Math.abs(dE) < tol) break
  }
  return E
}

export function positionAtMjd(
  orbit: OrbitalElements,
  targetMjd: number,
): { x: number; y: number; z: number } {
  const { semiMajorAxisAu: a, eccentricity: e } = orbit
  const inc = (orbit.inclinationDeg  * Math.PI) / 180
  const om  = (orbit.lonAscNodeDeg   * Math.PI) / 180
  const w   = (orbit.argPeriapsisDeg * Math.PI) / 180

  const M0 = (orbit.meanAnomalyDeg * Math.PI) / 180
  const n  = (2 * Math.PI) / orbit.periodDays
  const M  = M0 + n * (targetMjd - orbit.epochMjd)

  const E  = solveKepler(M, e)
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  )
  const r = a * (1 - e * Math.cos(E))

  const xOrb = r * Math.cos(nu)
  const yOrb = r * Math.sin(nu)

  const x1 = xOrb * Math.cos(w) - yOrb * Math.sin(w)
  const y1 = xOrb * Math.sin(w) + yOrb * Math.cos(w)

  const x2 = x1
  const y2 = y1 * Math.cos(inc)
  const z2 = y1 * Math.sin(inc)

  const x3 = x2 * Math.cos(om) - y2 * Math.sin(om)
  const y3 = x2 * Math.sin(om) + y2 * Math.cos(om)

  return { x: x3 * AU_M, y: y3 * AU_M, z: z2 * AU_M }
}

export function dateToMjd(date: Date): number {
  return date.getTime() / 86400000 + 40587
}

export function mjdToDate(mjd: number): Date {
  return new Date((mjd - 40587) * 86400000)
}

export function mjdToDateString(mjd: number): string {
  return mjdToDate(mjd).toISOString().slice(0, 10)
}

export function todayMjd(): number {
  return dateToMjd(new Date())
}

export function earthRotationRad(mjd: number): number {
  return (mjd * 2 * Math.PI) % (2 * Math.PI)
}
