export interface LaunchWindow {
  days_until_window: number
  transit_days: number
  synodic_period_days: number
  launch_date: string
  arrival_date: string
  window_label: string
  repeat_label: string
}

export interface MissionRoi {
  resource_value_usd: number
  resource_value_label: string
  reach_rating: string
  reach_summary: string
  mission_grade: string
  summary: string
}

export interface ResourceProfile {
  type_group: string
  type_label: string
  primary_resources: string[]
  estimated_mass_kg: number | null
  water_mass_kg: number | null
  metal_mass_kg: number | null
  pgm_mass_kg: number | null
  why_go_here: string
}

export interface AsteroidOrbit {
  asteroid_id: number
  name: string
  nasa_jpl_id: string
  absolute_magnitude_h: number | null
  estimated_diameter_km: number | null
  albedo: number | null
  spectral_type: string | null
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
  delta_v_kms: number
  accessibility_score: number
  prospecting_score: number
  resource_profile: ResourceProfile
  launch_window: LaunchWindow
  mission_roi: MissionRoi
}

export type ColorMode = 'spectral_type' | 'prospecting_score' | 'accessibility_score'

export type FlyTarget =
  | { kind: 'sol' }
  | { kind: 'planet'; planetId: string }
  | { kind: 'asteroid'; asteroid: AsteroidOrbit }

export type RendererMode = 'cesium' | 'spacekit'
