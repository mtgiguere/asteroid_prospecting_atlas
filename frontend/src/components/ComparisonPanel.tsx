import type { AsteroidOrbit } from '../types'
import styles from './ComparisonPanel.module.css'

interface Props {
  asteroidA: AsteroidOrbit
  asteroidB: AsteroidOrbit
  onClose: () => void
}

function winner(a: number, b: number, lowerIsBetter = false): 'a' | 'b' | null {
  if (a === b) return null
  if (lowerIsBetter) return a < b ? 'a' : 'b'
  return a > b ? 'a' : 'b'
}

function WinnerMark({ side, metric, w }: { side: 'a' | 'b'; metric: string; w: 'a' | 'b' | null }) {
  if (w !== side) return null
  return <span className={styles.winnerMark} data-testid={`winner-${metric}-${side}`}>▲</span>
}

function CompRow({
  label,
  valA,
  valB,
  metric,
  w,
}: {
  label: string
  valA: string
  valB: string
  metric: string
  w: 'a' | 'b' | null
}) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.cell}>
        <WinnerMark side="a" metric={metric} w={w} />
        {valA}
      </span>
      <span className={styles.cell}>
        {valB}
        <WinnerMark side="b" metric={metric} w={w} />
      </span>
    </div>
  )
}

export function ComparisonPanel({ asteroidA, asteroidB, onClose }: Props) {
  const roiA = asteroidA.mission_roi
  const roiB = asteroidB.mission_roi

  const resourceWinner = winner(roiA.resource_value_usd, roiB.resource_value_usd)
  const deltavWinner = winner(asteroidA.delta_v_kms, asteroidB.delta_v_kms, true)
  const diameterWinner = winner(
    asteroidA.estimated_diameter_km ?? 0,
    asteroidB.estimated_diameter_km ?? 0,
  )
  const transitWinner = winner(
    asteroidA.launch_window.transit_days,
    asteroidB.launch_window.transit_days,
    true,
  )
  const periodWinner = winner(asteroidA.orbital_period_days, asteroidB.orbital_period_days, true)

  const fmt = (v: number | null, suffix: string) =>
    v != null ? `${v.toFixed(2)}${suffix}` : '—'

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerName}>{asteroidA.name}</div>
        <div className={styles.vsLabel}>VS</div>
        <div className={styles.headerName} style={{ textAlign: 'right' }}>{asteroidB.name}</div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>RESOURCE VALUE</div>
        <div className={styles.bigValueRow}>
          <div className={styles.bigValueCell} data-winner={resourceWinner === 'a' || undefined}>
            <div className={styles.bigLabel}>{asteroidA.name}</div>
            <div className={styles.bigValue}>
              {resourceWinner === 'a' && (
                <span data-testid="winner-resource-a" style={{ fontSize: 11, marginRight: 4 }}>▲</span>
              )}
              {roiA.resource_value_label}
            </div>
          </div>
          <div className={styles.bigValueCell} data-winner={resourceWinner === 'b' || undefined}>
            <div className={styles.bigLabel}>{asteroidB.name}</div>
            <div className={styles.bigValue}>
              {resourceWinner === 'b' && (
                <span data-testid="winner-resource-b" style={{ fontSize: 11, marginRight: 4 }}>▲</span>
              )}
              {roiB.resource_value_label}
            </div>
          </div>
        </div>

        <div className={styles.gradeRow}>
          <div className={styles.gradeBadge} data-grade={roiA.mission_grade}>{roiA.mission_grade}</div>
          <div className={styles.gradeBadge} data-grade={roiB.mission_grade}>{roiB.mission_grade}</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>MISSION ACCESSIBILITY</div>
        <CompRow
          label="Delta-v"
          valA={`${asteroidA.delta_v_kms.toFixed(1)} km/s`}
          valB={`${asteroidB.delta_v_kms.toFixed(1)} km/s`}
          metric="deltav"
          w={deltavWinner}
        />
        <CompRow
          label="Reach"
          valA={roiA.reach_rating}
          valB={roiB.reach_rating}
          metric="reach"
          w={null}
        />
        <CompRow
          label="Transit"
          valA={`${Math.round(asteroidA.launch_window.transit_days)} days`}
          valB={`${Math.round(asteroidB.launch_window.transit_days)} days`}
          metric="transit"
          w={transitWinner}
        />
        <CompRow
          label="Launch"
          valA={asteroidA.launch_window.launch_date}
          valB={asteroidB.launch_window.launch_date}
          metric="launch"
          w={null}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>ORBITAL</div>
        <CompRow
          label="Semi-major axis"
          valA={`${asteroidA.semi_major_axis_au.toFixed(3)} AU`}
          valB={`${asteroidB.semi_major_axis_au.toFixed(3)} AU`}
          metric="sma"
          w={null}
        />
        <CompRow
          label="Eccentricity"
          valA={asteroidA.eccentricity.toFixed(4)}
          valB={asteroidB.eccentricity.toFixed(4)}
          metric="ecc"
          w={null}
        />
        <CompRow
          label="Inclination"
          valA={`${asteroidA.inclination_deg.toFixed(2)}°`}
          valB={`${asteroidB.inclination_deg.toFixed(2)}°`}
          metric="inc"
          w={null}
        />
        <CompRow
          label="Period"
          valA={`${Math.round(asteroidA.orbital_period_days)} days`}
          valB={`${Math.round(asteroidB.orbital_period_days)} days`}
          metric="period"
          w={periodWinner}
        />
        <CompRow
          label="Perihelion"
          valA={`${asteroidA.perihelion_au.toFixed(3)} AU`}
          valB={`${asteroidB.perihelion_au.toFixed(3)} AU`}
          metric="peri"
          w={null}
        />
        <CompRow
          label="Aphelion"
          valA={`${asteroidA.aphelion_au.toFixed(3)} AU`}
          valB={`${asteroidB.aphelion_au.toFixed(3)} AU`}
          metric="aph"
          w={null}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>PHYSICAL</div>
        <CompRow
          label="Diameter"
          valA={fmt(asteroidA.estimated_diameter_km, ' km')}
          valB={fmt(asteroidB.estimated_diameter_km, ' km')}
          metric="diameter"
          w={diameterWinner}
        />
        <CompRow
          label="Spectral type"
          valA={asteroidA.resource_profile.type_label}
          valB={asteroidB.resource_profile.type_label}
          metric="type"
          w={null}
        />
        <CompRow
          label="Albedo"
          valA={asteroidA.albedo != null ? asteroidA.albedo.toFixed(3) : '—'}
          valB={asteroidB.albedo != null ? asteroidB.albedo.toFixed(3) : '—'}
          metric="albedo"
          w={null}
        />
      </div>
    </div>
  )
}
