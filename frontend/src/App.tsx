import { useState, useCallback } from 'react'
import { SolarSystemViewer } from './components/SolarSystemViewer'
import { AsteroidInfoPanel } from './components/AsteroidInfoPanel'
import { Controls } from './components/Controls'
import { useAsteroids } from './hooks/useAsteroids'
import type { AsteroidOrbit, ScoreKey } from './types'

export default function App() {
  const [limit, setLimit] = useState(150)
  const [earthCrossingOnly, setEarthCrossingOnly] = useState(false)
  const [scoreKey, setScoreKey] = useState<ScoreKey>('prospecting_score')
  const [selected, setSelected] = useState<AsteroidOrbit | null>(null)

  const { asteroids, loading, error } = useAsteroids({ limit, earthCrossingOnly })

  const handleSelect = useCallback((asteroid: AsteroidOrbit | null) => {
    setSelected(asteroid)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <SolarSystemViewer
        asteroids={asteroids}
        selectedId={selected?.nasa_jpl_id ?? null}
        scoreKey={scoreKey}
        onSelect={handleSelect}
      />

      <Controls
        limit={limit}
        earthCrossingOnly={earthCrossingOnly}
        scoreKey={scoreKey}
        asteroidCount={asteroids.length}
        loading={loading}
        onLimitChange={setLimit}
        onEarthCrossingChange={setEarthCrossingOnly}
        onScoreKeyChange={setScoreKey}
      />

      {selected && (
        <AsteroidInfoPanel
          asteroid={selected}
          allAsteroids={asteroids}
          scoreKey={scoreKey}
          onClose={() => setSelected(null)}
        />
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
  )
}
