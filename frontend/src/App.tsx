import { useState, useCallback, useRef } from 'react'
import { SolarSystemViewer } from './components/SolarSystemViewer'
import type { SolarSystemViewerHandle } from './components/SolarSystemViewer'
import { AsteroidInfoPanel } from './components/AsteroidInfoPanel'
import { Controls } from './components/Controls'
import { NavigationSidebar } from './components/NavigationSidebar'
import { useAsteroids } from './hooks/useAsteroids'
import type { AsteroidOrbit, FlyTarget, ColorMode } from './types'

export default function App() {
  const viewerRef = useRef<SolarSystemViewerHandle>(null)

  const [limit, setLimit] = useState(500)
  const [earthCrossingOnly, setEarthCrossingOnly] = useState(false)
  const [colorMode, setColorMode] = useState<ColorMode>('spectral_type')
  const [selected, setSelected] = useState<AsteroidOrbit | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { asteroids, loading, error } = useAsteroids({ limit, earthCrossingOnly })

  const handleSelect = useCallback((asteroid: AsteroidOrbit | null) => {
    setSelected(asteroid)
  }, [])

  const handleFlyTo = useCallback(
    (target: FlyTarget) => {
      viewerRef.current?.flyTo(target)
      if (target.kind === 'asteroid') {
        setSelected(target.asteroid)
      } else {
        setSelected(null)
      }
    },
    [],
  )

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <NavigationSidebar asteroids={asteroids} onFlyTo={handleFlyTo} onHover={setHoveredId} />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <SolarSystemViewer
          ref={viewerRef}
          asteroids={asteroids}
          selectedId={selected?.nasa_jpl_id ?? null}
          hoveredId={hoveredId}
          colorMode={colorMode}
          onSelect={handleSelect}
          onHover={setHoveredId}
        />

        <Controls
          limit={limit}
          earthCrossingOnly={earthCrossingOnly}
          colorMode={colorMode}
          asteroidCount={asteroids.length}
          loading={loading}
          onLimitChange={setLimit}
          onEarthCrossingChange={setEarthCrossingOnly}
          onColorModeChange={setColorMode}
        />

        {hoveredId && (
          <span data-testid="hovered-asteroid-indicator" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
        )}

        {selected && (
          <>
            <span data-testid="selected-orbit-indicator" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
            <AsteroidInfoPanel
              asteroid={selected}
              allAsteroids={asteroids}
              onClose={() => setSelected(null)}
            />
          </>
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,50,30,0.15)',
              border: '1px solid rgba(255,50,30,0.4)',
              color: '#ff6650',
              padding: '10px 20px',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              zIndex: 20,
            }}
          >
            API error — is the FastAPI server running on port 8000?
          </div>
        )}
      </div>
    </div>
  )
}
