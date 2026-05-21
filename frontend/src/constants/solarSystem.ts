export interface PlanetDef {
  id: string
  name: string
  sma: number
  color: string
  ringAlpha: number
  pointSize: number
  angleDeg: number
}

export const SOL_ID = 'sol'

export const PLANETS: PlanetDef[] = [
  { id: 'mercury', name: 'Mercury', sma: 0.387, color: '#aaaaaa', ringAlpha: 0.35, pointSize: 5,  angleDeg: 48  },
  { id: 'venus',   name: 'Venus',   sma: 0.723, color: '#ddcc88', ringAlpha: 0.4,  pointSize: 7,  angleDeg: 120 },
  { id: 'earth',   name: 'Earth',   sma: 1.0,   color: '#4499ff', ringAlpha: 0.6,  pointSize: 9,  angleDeg: 0   },
  { id: 'mars',    name: 'Mars',    sma: 1.524, color: '#ff7755', ringAlpha: 0.45, pointSize: 7,  angleDeg: 205 },
  { id: 'jupiter', name: 'Jupiter', sma: 5.203, color: '#ddbb88', ringAlpha: 0.3,  pointSize: 14, angleDeg: 270 },
]
