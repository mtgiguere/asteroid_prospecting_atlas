import type { AsteroidOrbit, ScoreKey } from '../types'
import { scoreToHex } from '../utils/colorScale'
import { ResourceCard } from './ResourceCard'
import styles from './AsteroidInfoPanel.module.css'

interface Props {
  asteroid: AsteroidOrbit
  allAsteroids: AsteroidOrbit[]
  scoreKey: ScoreKey
  onClose: () => void
}

function ScoreBar({ score, min, max }: { score: number; min: number; max: number }) {
  const pct = max === min ? 0 : ((score - min) / (max - min)) * 100
  const color = scoreToHex(score, min, max)
  return (
    <div className={styles.scoreBarWrap}>
      <div className={styles.scoreBarTrack}>
        <div className={styles.scoreBarFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.scoreValue} style={{ color }}>{score.toFixed(3)}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  )
}

export function AsteroidInfoPanel({ asteroid, allAsteroids, scoreKey, onClose }: Props) {
  const scores = allAsteroids.map((a) => a[scoreKey])
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const allProspecting = allAsteroids.map((a) => a.prospecting_score)
  const allAccess = allAsteroids.map((a) => a.accessibility_score)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <div className={styles.name}>{asteroid.name}</div>
          <div className={styles.jplId}>JPL {asteroid.nasa_jpl_id}</div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
      </div>

      {asteroid.earth_orbit_crossing && (
        <div className={styles.badge}>⚡ EARTH-CROSSING</div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>SCORES</div>
        <div className={styles.scoreLine}>
          <span className={styles.scoreLabel}>PROSPECTING</span>
          <ScoreBar
            score={asteroid.prospecting_score}
            min={Math.min(...allProspecting)}
            max={Math.max(...allProspecting)}
          />
        </div>
        <div className={styles.scoreLine}>
          <span className={styles.scoreLabel}>ACCESSIBILITY</span>
          <ScoreBar
            score={asteroid.accessibility_score}
            min={Math.min(...allAccess)}
            max={Math.max(...allAccess)}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>ORBITAL ELEMENTS</div>
        <Row label="Semi-major axis" value={`${asteroid.semi_major_axis_au.toFixed(4)} AU`} />
        <Row label="Eccentricity" value={asteroid.eccentricity.toFixed(6)} />
        <Row label="Inclination" value={`${asteroid.inclination_deg.toFixed(3)}°`} />
        <Row label="Perihelion" value={`${asteroid.perihelion_au.toFixed(4)} AU`} />
        <Row label="Aphelion" value={`${asteroid.aphelion_au.toFixed(4)} AU`} />
        <Row label="Period" value={`${asteroid.orbital_period_days.toFixed(1)} days`} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>PHYSICAL</div>
        <Row
          label="Est. diameter"
          value={asteroid.estimated_diameter_km != null ? `${asteroid.estimated_diameter_km.toFixed(2)} km` : '—'}
        />
        <Row
          label="Abs. magnitude"
          value={asteroid.absolute_magnitude_h != null ? asteroid.absolute_magnitude_h.toFixed(2) : '—'}
        />
        <Row
          label="Albedo"
          value={asteroid.albedo != null ? asteroid.albedo.toFixed(3) : '—'}
        />
      </div>

      <div className={styles.legend}>
        <div className={styles.legendTitle}>SCORE LEGEND</div>
        <div className={styles.legendBar} />
        <div className={styles.legendLabels}>
          <span style={{ color: '#00ff8c' }}>BEST</span>
          <span style={{ color: '#ffd200' }}>MID</span>
          <span style={{ color: '#ff321e' }}>WORST</span>
        </div>
      </div>

      <ResourceCard profile={asteroid.resource_profile} />
    </div>
  )
}
