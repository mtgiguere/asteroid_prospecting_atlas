import type { ColorMode, RendererMode } from '../types'
import styles from './Controls.module.css'

interface Props {
  limit: number
  earthCrossingOnly: boolean
  colorMode: ColorMode
  asteroidCount: number
  loading: boolean
  rendererMode: RendererMode
  onLimitChange: (v: number) => void
  onEarthCrossingChange: (v: boolean) => void
  onColorModeChange: (v: ColorMode) => void
  onRendererChange: (v: RendererMode) => void
}

export function Controls({
  limit,
  earthCrossingOnly,
  colorMode,
  asteroidCount,
  loading,
  rendererMode,
  onLimitChange,
  onEarthCrossingChange,
  onColorModeChange,
  onRendererChange,
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
            value={colorMode}
            onChange={(e) => onColorModeChange(e.target.value as ColorMode)}
            className={styles.select}
          >
            <option value="spectral_type">Spectral Type</option>
            <option value="prospecting_score">Prospecting Score</option>
            <option value="accessibility_score">Accessibility Score</option>
          </select>
        </label>
      </div>

      <div className={styles.rendererToggle}>
        <span className={styles.label}>RENDERER</span>
        <button
          className={`${styles.toggleBtn} ${rendererMode === 'cesium' ? styles.toggleActive : ''}`}
          aria-pressed={rendererMode === 'cesium'}
          onClick={() => onRendererChange('cesium')}
        >
          CESIUM
        </button>
        <button
          className={`${styles.toggleBtn} ${rendererMode === 'spacekit' ? styles.toggleActive : ''}`}
          aria-pressed={rendererMode === 'spacekit'}
          onClick={() => onRendererChange('spacekit')}
        >
          SPACEKIT
        </button>
      </div>

      <span className={styles.status}>
        {loading ? 'LOADING...' : `${asteroidCount} BODIES`}
      </span>
    </div>
  )
}
