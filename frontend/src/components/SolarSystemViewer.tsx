import { useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
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
  BoundingSphere,
  defined,
  type Viewer as CesiumViewer,
} from 'cesium'
import type { AsteroidOrbit, FlyTarget, ScoreKey } from '../types'
import { PLANETS } from '../constants/solarSystem'
import { orbitToCartesian3, eclipticCircle, AU_M } from '../utils/orbitGeometry'
import { scoreToHex } from '../utils/colorScale'

export interface SolarSystemViewerHandle {
  flyTo: (target: FlyTarget) => void
}

interface Props {
  asteroids: AsteroidOrbit[]
  selectedId: string | null
  scoreKey: ScoreKey
  onSelect: (asteroid: AsteroidOrbit | null) => void
}

export const SolarSystemViewer = forwardRef<SolarSystemViewerHandle, Props>(
  function SolarSystemViewer({ asteroids, selectedId, scoreKey, onSelect }, ref) {
    const [viewer, setViewer] = useState<CesiumViewer | null>(null)

    const handleRef = useCallback((r: CesiumComponentRef<CesiumViewer> | null) => {
      setViewer(r?.cesiumElement ?? null)
    }, [])

    // Expose flyTo via ref
    useImperativeHandle(
      ref,
      () => ({
        flyTo(target: FlyTarget) {
          if (!viewer) return

          let position: Cartesian3
          let radius: number

          if (target.kind === 'sol') {
            position = Cartesian3.ZERO
            radius = 1.8e11
          } else if (target.kind === 'planet') {
            const planet = PLANETS.find((p) => p.id === target.planetId)
            if (!planet) return
            const rad = (planet.angleDeg * Math.PI) / 180
            position = new Cartesian3(
              Math.cos(rad) * planet.sma * AU_M,
              Math.sin(rad) * planet.sma * AU_M,
              0,
            )
            radius = planet.sma * AU_M * 0.15
          } else {
            const positions = orbitToCartesian3(
              target.asteroid.semi_major_axis_au,
              target.asteroid.eccentricity,
              target.asteroid.inclination_deg,
              target.asteroid.longitude_of_ascending_node_deg,
              target.asteroid.argument_of_periapsis_deg,
            )
            position = positions[0]
            radius = target.asteroid.semi_major_axis_au * AU_M * 0.08
          }

          viewer.camera.flyToBoundingSphere(new BoundingSphere(position, radius), {
            duration: 2.0,
          })
        },
      }),
      [viewer],
    )

    // One-time scene setup
    useEffect(() => {
      if (!viewer) return

      const scene = viewer.scene
      scene.globe.show = false
      if (scene.skyAtmosphere) scene.skyAtmosphere.show = false
      scene.backgroundColor = Color.BLACK
      scene.logarithmicDepthBuffer = true
      viewer.cesiumWidget.creditContainer.setAttribute('style', 'display:none')

      viewer.camera.setView({
        destination: new Cartesian3(0, -4.5e11, 2.8e11),
        orientation: { heading: 0, pitch: -0.52, roll: 0 },
      })

      const controller = viewer.scene.screenSpaceCameraController
      controller.zoomFactor = 2.0          // default 5.0 — much too fast at AU scale
      controller.minimumZoomDistance = 1e8 // ~0.001 AU — close enough to inspect a rock

      // Sol — 3-layer glow
      const sunPoints = new PointPrimitiveCollection()
      sunPoints.add({ position: Cartesian3.ZERO, color: Color.fromCssColorString('#ffee66').withAlpha(0.18), pixelSize: 72, disableDepthTestDistance: Number.POSITIVE_INFINITY })
      sunPoints.add({ position: Cartesian3.ZERO, color: Color.fromCssColorString('#fff5aa').withAlpha(0.5),  pixelSize: 36, disableDepthTestDistance: Number.POSITIVE_INFINITY })
      sunPoints.add({ position: Cartesian3.ZERO, color: Color.fromCssColorString('#ffffff'),                 pixelSize: 14, disableDepthTestDistance: Number.POSITIVE_INFINITY })
      scene.primitives.add(sunPoints)

      // Planet orbit rings
      const planetLines = new PolylineCollection()
      PLANETS.forEach((p) => {
        planetLines.add({
          positions: eclipticCircle(p.sma),
          width: p.name === 'Earth' ? 2 : 1,
          material: Material.fromType(Material.ColorType, {
            color: Color.fromCssColorString(p.color).withAlpha(p.ringAlpha),
          }),
        })
      })
      scene.primitives.add(planetLines)

      // Planet points spread around their orbits
      const planetPoints = new PointPrimitiveCollection()
      PLANETS.forEach((p) => {
        const rad = (p.angleDeg * Math.PI) / 180
        planetPoints.add({
          position: new Cartesian3(Math.cos(rad) * p.sma * AU_M, Math.sin(rad) * p.sma * AU_M, 0),
          color: Color.fromCssColorString(p.color),
          pixelSize: p.pointSize,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          id: `planet:${p.id}`,
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
    }, [viewer])

    // Asteroid orbit paths + points
    useEffect(() => {
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

        if (isSelected) {
          orbitLines.add({
            positions,
            width: 3,
            material: Material.fromType(Material.ColorType, {
              color: color.withAlpha(1.0),
            }),
          })
        }

        if (positions.length > 0) {
          asteroidPoints.add({
            position: positions[0],
            color,
            pixelSize: isSelected ? 10 : 5,
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
    }, [viewer, asteroids, selectedId, scoreKey])

    // Click picking — select asteroid or planet, then flyTo
    useEffect(() => {
      if (!viewer) return

      const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)

      handler.setInputAction(
        (event: { position: { x: number; y: number } }) => {
          const picked = viewer.scene.pick(event.position)
          if (!defined(picked)) {
            onSelect(null)
            return
          }

          if (typeof picked.id === 'string') {
            if (picked.id.startsWith('planet:')) {
              const planetId = picked.id.slice(7)
              const planet = PLANETS.find((p) => p.id === planetId)
              if (planet && ref && 'current' in ref && ref.current) {
                ref.current.flyTo({ kind: 'planet', planetId: planet.id })
              }
            } else {
              const found = asteroids.find((a) => a.nasa_jpl_id === picked.id) ?? null
              onSelect(found)
              if (found && ref && 'current' in ref && ref.current) {
                ref.current.flyTo({ kind: 'asteroid', asteroid: found })
              }
            }
          } else {
            onSelect(null)
          }
        },
        ScreenSpaceEventType.LEFT_CLICK,
      )

      return () => handler.destroy()
    }, [viewer, asteroids, onSelect, ref])

    return (
      <Viewer
        ref={handleRef}
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
  },
)
