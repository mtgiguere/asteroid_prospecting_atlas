import { mjdToDateString, todayMjd } from '../utils/orbitMechanics'

const SPEEDS = [
  { label: '1d',  days: 1   },
  { label: '30d', days: 30  },
  { label: '1y',  days: 365 },
]

interface Props {
  currentMjd: number
  playing: boolean
  speedDays: number
  onMjdChange: (mjd: number) => void
  onPlayToggle: () => void
  onSpeedChange: (days: number) => void
}

export function TimeControls({ currentMjd, playing, speedDays, onMjdChange, onPlayToggle, onSpeedChange }: Props) {
  const btnBase: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(80,120,200,0.25)',
    borderRadius: 3,
    color: '#7a99cc',
    fontSize: 9,
    letterSpacing: '0.06em',
    padding: '3px 8px',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono, monospace)',
  }
  const activeBtn: React.CSSProperties = {
    ...btnBase,
    background: 'rgba(80,140,255,0.2)',
    border: '1px solid rgba(80,140,255,0.5)',
    color: '#a8c0e8',
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(10, 14, 26, 0.85)',
        border: '1px solid rgba(100, 160, 255, 0.18)',
        borderRadius: 8,
        padding: '8px 14px',
        zIndex: 15,
        fontFamily: 'var(--font-mono, monospace)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 11, color: '#a8c0e8', minWidth: 80 }}>
        {mjdToDateString(currentMjd)}
      </span>

      <button
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={onPlayToggle}
        style={{ ...btnBase, minWidth: 48 }}
      >
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>

      <div style={{ display: 'flex', gap: 3 }}>
        {SPEEDS.map(({ label, days }) => (
          <button
            key={label}
            aria-label={label}
            onClick={() => onSpeedChange(days)}
            style={speedDays === days ? activeBtn : btnBase}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        aria-label="Today"
        onClick={() => onMjdChange(todayMjd())}
        style={btnBase}
      >
        Today
      </button>
    </div>
  )
}
