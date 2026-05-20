export interface AsteroidOrbit {
  asteroid_id: number
  name: string
  nasa_jpl_id: string
  absolute_magnitude_h: number | null
  estimated_diameter_km: number | null
  albedo: number | null
  epoch_mjd: number
  semi_major_axis_au: number
  eccentricity: number
  inclination_deg: number
  longitude_of_ascending_node_deg: number
  argument_of_periapsis_deg: number
  mean_anomaly_deg: number
  orbital_period_days: number
  perihelion_au: number
  aphelion_au: number
  earth_orbit_crossing: boolean
  accessibility_score: number
  prospecting_score: number
}

export type ScoreKey = 'prospecting_score' | 'accessibility_score'
