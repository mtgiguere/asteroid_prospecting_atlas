import { useState, useMemo } from 'react'
import { PLANETS } from '../constants/solarSystem'
import type { AsteroidOrbit, FlyTarget } from '../types'

type ResourceFilter = 'all' | 'water' | 'metals' | 'pgms'
type SortMode = 'score' | 'delta_v' | 'name' | 'window' | 'value'

const SORT_MODES: { id: SortMode; label: string }[] = [
  { id: 'score',   label: 'Score'   },
  { id: 'delta_v', label: 'Delta-v' },
  { id: 'name',    label: 'Name'    },
  { id: 'window',  label: 'Window'  },
  { id: 'value',   label: 'Value'   },
]

function sortAsteroids(asteroids: AsteroidOrbit[], mode: SortMode): AsteroidOrbit[] {
  const sorted = [...asteroids]
  if (mode === 'score')   sorted.sort((a, b) => a.prospecting_score - b.prospecting_score)
  if (mode === 'delta_v') sorted.sort((a, b) => a.delta_v_kms - b.delta_v_kms)
  if (mode === 'name')    sorted.sort((a, b) => a.name.localeCompare(b.name))
  if (mode === 'window')  sorted.sort((a, b) => {
    const da = a.launch_window?.days_until_window ?? Infinity
    const db = b.launch_window?.days_until_window ?? Infinity
    return da - db
  })
  if (mode === 'value')   sorted.sort((a, b) =>
    (b.mission_roi?.resource_value_usd ?? 0) - (a.mission_roi?.resource_value_usd ?? 0)
  )
  return sorted
}

const RESOURCE_FILTERS: { id: ResourceFilter; label: string }[] = [
  { id: 'all',    label: 'All'    },
  { id: 'water',  label: 'Water'  },
  { id: 'metals', label: 'Metals' },
  { id: 'pgms',   label: 'PGMs'   },
]

function matchesResourceFilter(asteroid: AsteroidOrbit, filter: ResourceFilter): boolean {
  if (filter === 'all') return true
  const g = asteroid.resource_profile?.type_group
  if (filter === 'water')  return g === 'C'
  if (filter === 'metals') return g === 'S' || g === 'M'
  if (filter === 'pgms')   return g === 'M'
  return true
}

interface Props {
  asteroids: AsteroidOrbit[]
  onFlyTo: (target: FlyTarget) => void
  onHover?: (id: string | null) => void
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
  onMouseEnter,
  onMouseLeave,
  children,
  'data-testid': testId,
}: {
  style: React.CSSProperties
  onClick: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  children: React.ReactNode
  'data-testid'?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...style, background: hovered ? HOVER_BG : 'transparent' }}
      onClick={onClick}
      onMouseEnter={() => { setHovered(true); onMouseEnter?.() }}
      onMouseLeave={() => { setHovered(false); onMouseLeave?.() }}
      data-testid={testId}
    >
      {children}
    </div>
  )
}

export function NavigationSidebar({ asteroids, onFlyTo, onHover }: Props) {
  const [query, setQuery] = useState('')
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('score')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = asteroids.filter((a) =>
      matchesResourceFilter(a, resourceFilter) &&
      (q === '' || a.name.toLowerCase().includes(q))
    )
    return sortAsteroids(base, sortMode)
  }, [asteroids, query, resourceFilter, sortMode])

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
          data-testid="planet-list-item"
        >
          <div style={S.dot(p.color)} />
          <span>{p.name}</span>
        </HoverRow>
      ))}

      {/* Asteroids */}
      <div style={S.sectionLabel}>Asteroids</div>
      <div style={S.count}>{filtered.length} bodies</div>
      <div style={{ padding: '4px 10px 0' }}>
        <label
          htmlFor="sort-select"
          style={{ display: 'none' }}
        >
          Sort
        </label>
        <select
          id="sort-select"
          aria-label="Sort"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(80,120,200,0.25)',
            borderRadius: 4,
            color: '#a8c0e8',
            fontSize: 10,
            letterSpacing: '0.06em',
            padding: '4px 6px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono, monospace)',
            outline: 'none',
          }}
        >
          {SORT_MODES.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '4px 10px 0' }}>
        {RESOURCE_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setResourceFilter(id)}
            style={{
              flex: 1,
              background: resourceFilter === id ? 'rgba(80,140,255,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${resourceFilter === id ? 'rgba(80,140,255,0.5)' : 'rgba(80,120,200,0.2)'}`,
              borderRadius: 3,
              color: resourceFilter === id ? '#a8c0e8' : '#4a6a9f',
              fontSize: 9,
              letterSpacing: '0.06em',
              padding: '3px 0',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {label}
          </button>
        ))}
      </div>
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
            onMouseEnter={() => onHover?.(a.nasa_jpl_id)}
            onMouseLeave={() => onHover?.(null)}
            data-testid="asteroid-list-item"
          >
            <div style={S.asteroidName}>{a.name}</div>
            <div style={S.asteroidScore}>
              {sortMode === 'delta_v'
                ? `Δv ${a.delta_v_kms.toFixed(2)} km/s`
                : sortMode === 'window'
                ? (a.launch_window?.window_label ?? '—')
                : sortMode === 'value'
                ? (a.mission_roi?.resource_value_label ?? '—')
                : `score ${a.prospecting_score.toFixed(3)}`}
            </div>
          </HoverRow>
        ))}
      </div>
    </div>
  )
}
