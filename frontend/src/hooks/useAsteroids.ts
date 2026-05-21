import { useState, useEffect } from 'react'
import type { AsteroidOrbit } from '../types'

export function getApiBase(): string {
  return import.meta.env.VITE_API_BASE || 'http://localhost:8000'
}

interface UseAsteroidsOptions {
  limit: number
  earthCrossingOnly: boolean
}

interface UseAsteroidsResult {
  asteroids: AsteroidOrbit[]
  loading: boolean
  error: string | null
}

export function useAsteroids({ limit, earthCrossingOnly }: UseAsteroidsOptions): UseAsteroidsResult {
  const [asteroids, setAsteroids] = useState<AsteroidOrbit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      limit: String(limit),
      earth_crossing_only: String(earthCrossingOnly),
    })

    fetch(`${getApiBase()}/asteroids/orbits?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`)
        return res.json() as Promise<AsteroidOrbit[]>
      })
      .then((data) => {
        setAsteroids(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      })
  }, [limit, earthCrossingOnly])

  return { asteroids, loading, error }
}
