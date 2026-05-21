import { useState, useMemo } from 'react'
import { PLANETS } from '../constants/solarSystem'
import type { AsteroidOrbit, FlyTarget } from '../types'

interface Props {
  asteroids: AsteroidOrbit[]
  onFlyTo: (target: FlyTarget) => void
}

const S = {
  sidebar: {
    width: 230,
    minWidth: 230,
    height: '100%',
    background: '#08080f',
    borderRight: '1px solid rgba(80,120,200,0.18)',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: 'var(--font-mono, monospace)',
    color: '#ccd6f6',
    overflowY: 'hidden' as const,
    zIndex: 10,
  },
  header: {
    padding: '14px 14px 8px',
    fontSize: 10,
    letterSpacing: '0.12em',
    color: '#4a7abf',
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid rgba(80,120,200,0.12)',
  },
  sectionLabel: {
    padding: '10px 14px 4px',
    fontSize: 9,
    letterSpacing: '0.14em',
    color: '#3a5a8f',
    textTransform: 'uppercase' as const,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 12,
    borderRadius: 3,
    margin: '1px 6px',
    transition: 'background 0.1s',
  },
  dot: (color: string) => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),
  searchWrap: {
    padding: '8px 10px 4px',
  },
  searchInput: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(80,120,200,0.25)',
    borderRadius: 4,
    color: '#ccd6f6',
    fontSize: 11,
    padding: '5px 8px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  asteroidList: {
    flex: 1,
    overflowY: 'auto' as const,
    paddingBottom: 8,
  },
  asteroidRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '5px 14px',
    cursor: 'pointer',
    margin: '1px 6px',
    borderRadius: 3,
    fontSize: 11,
  },
  asteroidName: {
    color: '#a8c0e8',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  asteroidScore: {
    fontSize: 9,
    color: '#4a6a9f',
    marginTop: 1,
  },
  count: {
    padding: '4px 14px 2px',
    fontSize: 9,
    color: '#3a5a8f',
  },
}

const HOVER_BG = 'rgba(80,140,255,0.1)'

function HoverRow({
  style,
  onClick,
  children,
}: {
  style: React.CSSProperties
  onClick: () => void
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...style, background: hovered ? HOVER_BG : 'transparent' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  )
}

export function NavigationSidebar({ asteroids, onFlyTo }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return asteroids
    return asteroids.filter((a) => a.name.toLowerCase().includes(q))
  }, [asteroids, query])

  return (
    <div style={S.sidebar}>
      <div style={S.header}>Navigation</div>

      {/* Sol */}
      <div style={S.sectionLabel}>Star</div>
      <HoverRow style={S.row} onClick={() => onFlyTo({ kind: 'sol' })}>
        <div style={{ ...S.dot('#fff5aa'), boxShadow: '0 0 6px #ffee66' }} />
        <span>Sol</span>
      </HoverRow>

      {/* Planets */}
      <div style={S.sectionLabel}>Planets</div>
      {PLANETS.map((p) => (
        <HoverRow
          key={p.id}
          style={S.row}
          onClick={() => onFlyTo({ kind: 'planet', planetId: p.id })}
        >
          <div style={S.dot(p.color)} />
          <span>{p.name}</span>
        </HoverRow>
      ))}

      {/* Asteroids */}
      <div style={S.sectionLabel}>Asteroids</div>
      <div style={S.count}>{asteroids.length} bodies</div>
      <div style={S.searchWrap}>
        <input
          type="search"
          role="searchbox"
          placeholder="Search asteroids..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={S.searchInput}
        />
      </div>
      <div style={S.asteroidList}>
        {filtered.map((a) => (
          <HoverRow
            key={a.nasa_jpl_id}
            style={S.asteroidRow}
            onClick={() => onFlyTo({ kind: 'asteroid', asteroid: a })}
          >
            <div style={S.asteroidName}>{a.name}</div>
            <div style={S.asteroidScore}>score {a.prospecting_score.toFixed(3)}</div>
          </HoverRow>
        ))}
      </div>
    </div>
  )
}
