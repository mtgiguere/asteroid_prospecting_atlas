import { Cartesian3 } from 'cesium'

export const AU_M = 1.496e11

export function orbitToCartesian3(
  semiMajorAxisAu: number,
  eccentricity: number,
  inclinationDeg: number,
  lonAscNodeDeg: number,
  argPeriapsisDeg: number,
  numPoints = 120,
): Cartesian3[] {
  const inc = (inclinationDeg * Math.PI) / 180
  const om = (lonAscNodeDeg * Math.PI) / 180
  const w = (argPeriapsisDeg * Math.PI) / 180

  const positions: Cartesian3[] = []

  for (let step = 0; step <= numPoints; step++) {
    const nu = (2 * Math.PI * step) / numPoints
    const r =
      (semiMajorAxisAu * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(nu))

    const xOrb = r * Math.cos(nu)
    const yOrb = r * Math.sin(nu)

    // Rotate by argument of periapsis
    const x1 = xOrb * Math.cos(w) - yOrb * Math.sin(w)
    const y1 = xOrb * Math.sin(w) + yOrb * Math.cos(w)

    // Rotate by inclination
    const x2 = x1
    const y2 = y1 * Math.cos(inc)
    const z2 = y1 * Math.sin(inc)

    // Rotate by longitude of ascending node
    const x3 = x2 * Math.cos(om) - y2 * Math.sin(om)
    const y3 = x2 * Math.sin(om) + y2 * Math.cos(om)
    const z3 = z2

    positions.push(new Cartesian3(x3 * AU_M, y3 * AU_M, z3 * AU_M))
  }

  return positions
}

export function eclipticCircle(radiusAu: number, numPoints = 180): Cartesian3[] {
  const positions: Cartesian3[] = []
  for (let step = 0; step <= numPoints; step++) {
    const angle = (2 * Math.PI * step) / numPoints
    positions.push(
      new Cartesian3(
        Math.cos(angle) * radiusAu * AU_M,
        Math.sin(angle) * radiusAu * AU_M,
        0,
      ),
    )
  }
  return positions
}
