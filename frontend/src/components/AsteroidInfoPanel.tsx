import type { AsteroidOrbit, CostTiers } from '../types'
import { suggestCompanions } from '../utils/missionCompanions'
import { ResourceCard } from './ResourceCard'
import styles from './AsteroidInfoPanel.module.css'

interface Props {
  asteroid: AsteroidOrbit
  allAsteroids: AsteroidOrbit[]
  onClose: () => void
  onSelectCompanion: (asteroid: AsteroidOrbit) => void
  onCompare?: () => void
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  )
}

const TIER_LABELS: Record<string, string> = {
  flyby: 'Flyby',
  rendezvous: 'Rendezvous',
  sample_return: 'Sample Return',
}

function CostTiersTable({ tiers }: { tiers: CostTiers }) {
  const tierKeys = ['flyby', 'rendezvous', 'sample_return'] as const
  return (
    <div className={styles.costTable}>
      {tierKeys.map((key) => {
        const t = tiers[key]
        const isRec = tiers.recommended === key
        return (
          <div key={key} className={styles.costRow} data-recommended={isRec || undefined}>
            <span className={styles.costTierName}>
              {TIER_LABELS[key]}
              {isRec && <span className={styles.recBadge}>REC</span>}
            </span>
            <span className={styles.costAmount}>{t.cost_label}</span>
            <span className={styles.costRoi} data-positive={t.roi_ratio >= 1 || undefined}>
              {t.roi_label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function AsteroidInfoPanel({ asteroid, allAsteroids, onClose, onSelectCompanion, onCompare }: Props) {
  const roi = asteroid.mission_roi
  const companions = suggestCompanions(asteroid, allAsteroids, 2)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <div className={styles.name}>{asteroid.name}</div>
          <div className={styles.jplId}>JPL {asteroid.nasa_jpl_id}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {onCompare && (
            <button className={styles.closeBtn} onClick={onCompare} aria-label="Compare" style={{ fontSize: 10, letterSpacing: '0.1em', padding: '3px 8px', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 3 }}>
              COMPARE
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>

      {asteroid.earth_orbit_crossing && (
        <div className={styles.badge}>⚡ EARTH-CROSSING</div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>MISSION ANALYSIS</div>

        <div className={styles.roiValue}>{roi.resource_value_label}</div>
        <div className={styles.roiGrade} data-grade={roi.mission_grade}>{roi.mission_grade}</div>

        <div className={styles.roiReach}>
          <span className={styles.roiReachLabel}>REACH</span>
          <span className={styles.roiReachValue}>{roi.reach_rating}</span>
        </div>
        <div className={styles.roiFuelNote}>{roi.reach_summary}</div>

        <div className={styles.roiSummary}>{roi.summary}</div>

        <div className={styles.costSectionTitle}>MISSION COST MODEL</div>
        <CostTiersTable tiers={roi.cost_tiers} />
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

      <div className={styles.section}>
        <div className={styles.sectionTitle}>NEXT LAUNCH WINDOW</div>
        <div className={styles.windowLabel}>{asteroid.launch_window.window_label}</div>
        <Row label="Launch" value={asteroid.launch_window.launch_date} />
        <Row label="Arrival" value={asteroid.launch_window.arrival_date} />
        <Row label="Transit" value={`${Math.round(asteroid.launch_window.transit_days)} days`} />
        <div className={styles.windowRepeat}>{asteroid.launch_window.repeat_label}</div>
      </div>

      {companions.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>MISSION PARTNERS</div>
          <div className={styles.companionNote}>
            Nearby targets worth chaining into the same mission
          </div>
          {companions.map((c) => (
            <button
              key={c.asteroid.nasa_jpl_id}
              className={styles.companionCard}
              onClick={() => onSelectCompanion(c.asteroid)}
            >
              <div className={styles.companionName}>{c.asteroid.name}</div>
              <div className={styles.companionMeta}>
                <span className={styles.companionType}>
                  {c.asteroid.resource_profile?.type_group ?? '?'}-type
                </span>
                <span className={styles.companionDv}>
                  +{c.additional_dv_kms.toFixed(1)} km/s
                </span>
              </div>
              <div className={styles.companionRationale}>{c.rationale}</div>
            </button>
          ))}
        </div>
      )}

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
