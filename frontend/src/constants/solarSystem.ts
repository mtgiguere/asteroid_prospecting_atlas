export interface PlanetDef {
  id: string
  name: string
  sma: number
  color: string
  ringAlpha: number
  pointSize: number
  angleDeg: number    // J2000 mean ecliptic longitude (degrees); reference epoch MJD 51544.5
  periodDays: number  // sidereal orbital period
}

export const SOL_ID = 'sol'

// J2000 mean longitudes and sidereal periods from standard planetary tables
export const PLANETS: PlanetDef[] = [
  { id: 'mercury', name: 'Mercury', sma: 0.387, color: '#bbbbbb', ringAlpha: 0.35, pointSize: 8,  angleDeg: 252.25, periodDays: 87.969   },
  { id: 'venus',   name: 'Venus',   sma: 0.723, color: '#f0d080', ringAlpha: 0.4,  pointSize: 10, angleDeg: 181.98, periodDays: 224.701  },
  { id: 'earth',   name: 'Earth',   sma: 1.0,   color: '#4499ff', ringAlpha: 0.6,  pointSize: 22, angleDeg: 100.46, periodDays: 365.250  },
  { id: 'mars',    name: 'Mars',    sma: 1.524, color: '#ff6644', ringAlpha: 0.45, pointSize: 9,  angleDeg: 355.45, periodDays: 686.971  },
  { id: 'jupiter', name: 'Jupiter', sma: 5.203, color: '#ddbb88', ringAlpha: 0.3,  pointSize: 30, angleDeg: 34.40,  periodDays: 4332.59  },
]
