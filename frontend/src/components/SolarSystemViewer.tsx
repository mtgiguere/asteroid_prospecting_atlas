import { useEffect, useRef, useCallback } from 'react'
import { Viewer } from 'resium'
import type { CesiumComponentRef } from 'resium'
import {
  Cartesian3,
  Color,
  PolylineCollection,
  PointPrimitiveCollection,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Material,
  defined,
  type Viewer as CesiumViewer,
} from 'cesium'
import type { AsteroidOrbit, ScoreKey } from '../types'
import { orbitToCartesian3, eclipticCircle, AU_M } from '../utils/orbitGeometry'
import { scoreToHex } from '../utils/colorScale'

const PLANETS = [
  { name: 'Mercury', sma: 0.387, color: '#888888', alpha: 0.3 },
  { name: 'Venus', sma: 0.723, color: '#ddaa44', alpha: 0.3 },
  { name: 'Earth', sma: 1.0, color: '#4499ff', alpha: 0.5 },
  { name: 'Mars', sma: 1.524, color: '#ff6644', alpha: 0.35 },
  { name: 'Jupiter', sma: 5.203, color: '#cc9955', alpha: 0.25 },
]

const PLANET_COLORS: Record<string, string> = {
  Mercury: '#aaaaaa',
  Venus: '#ddcc88',
  Earth: '#4499ff',
  Mars: '#ff7755',
  Jupiter: '#ddbb88',
}

interface Props {
  asteroids: AsteroidOrbit[]
  selectedId: string | null
  scoreKey: ScoreKey
  onSelect: (asteroid: AsteroidOrbit | null) => void
}

export function SolarSystemViewer({ asteroids, selectedId, scoreKey, onSelect }: Props) {
  const viewerRef = useRef<CesiumViewer | null>(null)
  const sceneReadyRef = useRef(false)

  const setViewerRef = useCallback((ref: CesiumComponentRef<CesiumViewer> | null) => {
    viewerRef.current = ref?.cesiumElement ?? null
  }, [])

  // One-time scene setup
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || sceneReadyRef.current) return
    sceneReadyRef.current = true

    const scene = viewer.scene
    scene.globe.show = false
    scene.skyAtmosphere.show = false
    scene.backgroundColor = Color.BLACK
    scene.logarithmicDepthBuffer = true
    viewer.cesiumWidget.creditContainer.setAttribute('style', 'display:none')

    // Camera: angled view of the inner solar system
    viewer.camera.setView({
      destination: new Cartesian3(0, -5e11, 3.2e11),
      orientation: { heading: 0, pitch: -0.55, roll: 0 },
    })

    // Sun
    const sunPoints = new PointPrimitiveCollection()
    sunPoints.add({
      position: Cartesian3.ZERO,
      color: Color.fromCssColorString('#ffee66'),
      pixelSize: 28,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    })
    scene.primitives.add(sunPoints)

    // Planet orbit rings
    const planetLines = new PolylineCollection()
    PLANETS.forEach((planet) => {
      planetLines.add({
        positions: eclipticCircle(planet.sma),
        width: planet.name === 'Earth' ? 1.5 : 1,
        material: Material.fromType(Material.ColorType, {
          color: Color.fromCssColorString(planet.color).withAlpha(planet.alpha),
        }),
      })
    })
    scene.primitives.add(planetLines)

    // Planet points
    const planetPoints = new PointPrimitiveCollection()
    PLANETS.forEach((planet) => {
      planetPoints.add({
        position: new Cartesian3(planet.sma * AU_M, 0, 0),
        color: Color.fromCssColorString(PLANET_COLORS[planet.name] ?? '#ffffff'),
        pixelSize: planet.name === 'Jupiter' ? 10 : 6,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })
    })
    scene.primitives.add(planetPoints)

    return () => {
      if (!viewer.isDestroyed()) {
        scene.primitives.remove(sunPoints)
        scene.primitives.remove(planetLines)
        scene.primitives.remove(planetPoints)
      }
    }
  }, [viewerRef.current]) // eslint-disable-line react-hooks/exhaustive-deps

  // Asteroid orbit paths + points (re-renders when data or selection changes)
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || asteroids.length === 0) return

    const scene = viewer.scene
    const scores = asteroids.map((a) => a[scoreKey])
    const minScore = Math.min(...scores)
    const maxScore = Math.max(...scores)

    const orbitLines = new PolylineCollection()
    const asteroidPoints = new PointPrimitiveCollection()

    asteroids.forEach((asteroid) => {
      const isSelected = asteroid.nasa_jpl_id === selectedId
      const hex = scoreToHex(asteroid[scoreKey], minScore, maxScore)
      const color = Color.fromCssColorString(hex)

      const positions = orbitToCartesian3(
        asteroid.semi_major_axis_au,
        asteroid.eccentricity,
        asteroid.inclination_deg,
        asteroid.longitude_of_ascending_node_deg,
        asteroid.argument_of_periapsis_deg,
      )

      orbitLines.add({
        positions,
        width: isSelected ? 2.5 : 1,
        material: Material.fromType(Material.ColorType, {
          color: color.withAlpha(isSelected ? 1.0 : 0.55),
        }),
      })

      // Place point at first position (near perihelion)
      if (positions.length > 0) {
        asteroidPoints.add({
          position: positions[0],
          color: color,
          pixelSize: isSelected ? 9 : 4,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          id: asteroid.nasa_jpl_id,
        })
      }
    })

    scene.primitives.add(orbitLines)
    scene.primitives.add(asteroidPoints)

    return () => {
      if (!viewer.isDestroyed()) {
        scene.primitives.remove(orbitLines)
        scene.primitives.remove(asteroidPoints)
      }
    }
  }, [asteroids, selectedId, scoreKey])

  // Mouse picking
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)

    handler.setInputAction(
      (event: { position: { x: number; y: number } }) => {
        const picked = viewer.scene.pick(event.position)
        if (defined(picked) && typeof picked.id === 'string') {
          const found = asteroids.find((a) => a.nasa_jpl_id === picked.id) ?? null
          onSelect(found)
        } else {
          onSelect(null)
        }
      },
      ScreenSpaceEventType.LEFT_CLICK,
    )

    return () => handler.destroy()
  }, [asteroids, onSelect])

  return (
    <Viewer
      ref={setViewerRef}
      full
      timeline={false}
      animation={false}
      baseLayerPicker={false}
      homeButton={false}
      sceneModePicker={false}
      navigationHelpButton={false}
      geocoder={false}
      infoBox={false}
      selectionIndicator={false}
    />
  )
}
