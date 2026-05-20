import type { ScoreKey } from '../types'
import styles from './Controls.module.css'

interface Props {
  limit: number
  earthCrossingOnly: boolean
  scoreKey: ScoreKey
  asteroidCount: number
  loading: boolean
  onLimitChange: (v: number) => void
  onEarthCrossingChange: (v: boolean) => void
  onScoreKeyChange: (v: ScoreKey) => void
}

export function Controls({
  limit,
  earthCrossingOnly,
  scoreKey,
  asteroidCount,
  loading,
  onLimitChange,
  onEarthCrossingChange,
  onScoreKeyChange,
}: Props) {
  return (
    <div className={styles.bar}>
      <span className={styles.title}>ASTEROID PROSPECTING ATLAS</span>

      <div className={styles.controls}>
        <label className={styles.field}>
          <span className={styles.label}>OBJECTS</span>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.value}>{limit}</span>
        </label>

        <label className={styles.field}>
          <input
            type="checkbox"
            checked={earthCrossingOnly}
            onChange={(e) => onEarthCrossingChange(e.target.checked)}
            className={styles.checkbox}
          />
          <span className={styles.label}>EARTH-CROSSING ONLY</span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>COLOR BY</span>
          <select
            value={scoreKey}
            onChange={(e) => onScoreKeyChange(e.target.value as ScoreKey)}
            className={styles.select}
          >
            <option value="prospecting_score">Prospecting Score</option>
            <option value="accessibility_score">Accessibility Score</option>
          </select>
        </label>
      </div>

      <span className={styles.status}>
        {loading ? 'LOADING...' : `${asteroidCount} BODIES`}
      </span>
    </div>
  )
}
