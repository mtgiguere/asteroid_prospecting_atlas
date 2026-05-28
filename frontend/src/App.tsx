import { useState, useCallback, useRef, useEffect } from 'react'
import { SolarSystemViewer } from './components/SolarSystemViewer'
import type { SolarSystemViewerHandle } from './components/SolarSystemViewer'
import { SpacekitViewer } from './components/SpacekitViewer'
import { AsteroidInfoPanel } from './components/AsteroidInfoPanel'
import { Controls } from './components/Controls'
import { NavigationSidebar } from './components/NavigationSidebar'
import { SpectralTypeLegend } from './components/SpectralTypeLegend'
import { TimeControls } from './components/TimeControls'
import { useAsteroids } from './hooks/useAsteroids'
import { todayMjd } from './utils/orbitMechanics'
import type { AsteroidOrbit, FlyTarget, ColorMode, RendererMode } from './types'

export default function App() {
  const viewerRef = useRef<SolarSystemViewerHandle>(null)

  const [limit, setLimit] = useState(500)
  const [earthCrossingOnly, setEarthCrossingOnly] = useState(false)
  const [colorMode, setColorMode] = useState<ColorMode>('spectral_type')
  const [selected, setSelected] = useState<AsteroidOrbit | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [currentMjd, setCurrentMjd] = useState(() => todayMjd())
  const [playing, setPlaying] = useState(false)
  const [speedDays, setSpeedDays] = useState(1)
  const [rendererMode, setRendererMode] = useState<RendererMode>('cesium')

  const { asteroids, loading, error } = useAsteroids({ limit, earthCrossingOnly })

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setCurrentMjd((m) => m + speedDays), 50)
    return () => clearInterval(id)
  }, [playing, speedDays])

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

  const sharedViewerProps = {
    asteroids,
    selectedId: selected?.nasa_jpl_id ?? null,
    hoveredId,
    colorMode,
    currentMjd,
    onSelect: handleSelect,
    onHover: setHoveredId,
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <NavigationSidebar asteroids={asteroids} onFlyTo={handleFlyTo} onHover={setHoveredId} />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {rendererMode === 'cesium' ? (
          <SolarSystemViewer ref={viewerRef} {...sharedViewerProps} />
        ) : (
          <SpacekitViewer ref={viewerRef} {...sharedViewerProps} />
        )}

        <SpectralTypeLegend colorMode={colorMode} panelOpen={selected !== null} />
        <TimeControls
          currentMjd={currentMjd}
          playing={playing}
          speedDays={speedDays}
          onMjdChange={setCurrentMjd}
          onPlayToggle={() => setPlaying((p) => !p)}
          onSpeedChange={setSpeedDays}
        />

        <Controls
          limit={limit}
          earthCrossingOnly={earthCrossingOnly}
          colorMode={colorMode}
          asteroidCount={asteroids.length}
          loading={loading}
          rendererMode={rendererMode}
          onLimitChange={setLimit}
          onEarthCrossingChange={setEarthCrossingOnly}
          onColorModeChange={setColorMode}
          onRendererChange={setRendererMode}
        />

        {hoveredId && (
          <span data-testid="hovered-asteroid-indicator" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
        )}

        {selected && (
          <>
            <span data-testid="selected-orbit-indicator" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
            <AsteroidInfoPanel
              asteroid={selected}
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
