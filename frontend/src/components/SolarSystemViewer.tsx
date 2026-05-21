import { useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { Viewer } from 'resium'
import type { CesiumComponentRef } from 'resium'
import {
  Cartesian3,
  Cartesian2,
  Color,
  LabelCollection,
  LabelStyle,
  PolylineCollection,
  PointPrimitiveCollection,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Material,
  BoundingSphere,
  defined,
  type Viewer as CesiumViewer,
} from 'cesium'
import type { AsteroidOrbit, FlyTarget, ColorMode } from '../types'
import { PLANETS } from '../constants/solarSystem'
import { orbitToCartesian3, eclipticCircle, AU_M } from '../utils/orbitGeometry'
import { scoreToHex } from '../utils/colorScale'
import { spectralTypeGroupToHex } from '../utils/spectralTypeColor'

export interface SolarSystemViewerHandle {
  flyTo: (target: FlyTarget) => void
}

interface Props {
  asteroids: AsteroidOrbit[]
  selectedId: string | null
  hoveredId: string | null
  colorMode: ColorMode
  onSelect: (asteroid: AsteroidOrbit | null) => void
  onHover: (id: string | null) => void
}

export const SolarSystemViewer = forwardRef<SolarSystemViewerHandle, Props>(
  function SolarSystemViewer({ asteroids, selectedId, hoveredId, colorMode, onSelect, onHover }, ref) {
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

      // Sol — 4-layer glow (outer halo + mid corona + bright core + white hot centre)
      const sunPoints = new PointPrimitiveCollection()
      sunPoints.add({ position: Cartesian3.ZERO, color: Color.fromCssColorString('#ff9900').withAlpha(0.08), pixelSize: 160, disableDepthTestDistance: Number.POSITIVE_INFINITY })
      sunPoints.add({ position: Cartesian3.ZERO, color: Color.fromCssColorString('#ffee66').withAlpha(0.18), pixelSize: 90,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
      sunPoints.add({ position: Cartesian3.ZERO, color: Color.fromCssColorString('#fff5aa').withAlpha(0.6),  pixelSize: 42,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
      sunPoints.add({ position: Cartesian3.ZERO, color: Color.fromCssColorString('#ffffff'),                 pixelSize: 18,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
      scene.primitives.add(sunPoints)

      // Sol label
      const sunLabel = new LabelCollection()
      sunLabel.add({
        position: Cartesian3.ZERO,
        text: 'Sol',
        font: 'bold 13px monospace',
        fillColor: Color.fromCssColorString('#fff5aa'),
        outlineColor: Color.BLACK,
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cartesian2(22, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })
      scene.primitives.add(sunLabel)

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

      // Planet points + name labels
      const planetPoints = new PointPrimitiveCollection()
      const planetLabels = new LabelCollection()
      PLANETS.forEach((p) => {
        const rad = (p.angleDeg * Math.PI) / 180
        const pos = new Cartesian3(Math.cos(rad) * p.sma * AU_M, Math.sin(rad) * p.sma * AU_M, 0)
        planetPoints.add({
          position: pos,
          color: Color.fromCssColorString(p.color),
          pixelSize: p.pointSize,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          id: `planet:${p.id}`,
        })
        planetLabels.add({
          position: pos,
          text: p.name,
          font: '12px monospace',
          fillColor: Color.fromCssColorString(p.color),
          outlineColor: Color.BLACK,
          outlineWidth: 3,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(p.pointSize / 2 + 6, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        })
      })
      scene.primitives.add(planetPoints)
      scene.primitives.add(planetLabels)

      // Main asteroid belt context ring (2.2–3.2 AU, faint grey)
      const beltLines = new PolylineCollection()
      beltLines.add({
        positions: eclipticCircle(2.2),
        width: 1,
        material: Material.fromType(Material.ColorType, {
          color: Color.fromCssColorString('#555566').withAlpha(0.25),
        }),
      })
      beltLines.add({
        positions: eclipticCircle(3.2),
        width: 1,
        material: Material.fromType(Material.ColorType, {
          color: Color.fromCssColorString('#555566').withAlpha(0.25),
        }),
      })
      scene.primitives.add(beltLines)

      return () => {
        if (!viewer.isDestroyed()) {
          scene.primitives.remove(sunPoints)
          scene.primitives.remove(sunLabel)
          scene.primitives.remove(planetLines)
          scene.primitives.remove(planetPoints)
          scene.primitives.remove(planetLabels)
          scene.primitives.remove(beltLines)
        }
      }
    }, [viewer])

    // Asteroid orbit paths + points
    useEffect(() => {
      if (!viewer || asteroids.length === 0) return

      const scene = viewer.scene

      let minScore = 0
      let maxScore = 1
      if (colorMode !== 'spectral_type') {
        const scores = asteroids.map((a) => a[colorMode])
        minScore = Math.min(...scores)
        maxScore = Math.max(...scores)
      }

      const orbitLines = new PolylineCollection()
      const asteroidPoints = new PointPrimitiveCollection()

      asteroids.forEach((asteroid) => {
        const isSelected = asteroid.nasa_jpl_id === selectedId
        const isHovered = asteroid.nasa_jpl_id === hoveredId
        const hex =
          colorMode === 'spectral_type'
            ? spectralTypeGroupToHex(asteroid.resource_profile?.type_group ?? null)
            : scoreToHex(asteroid[colorMode], minScore, maxScore)
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
            color: isHovered ? Color.WHITE : color,
            pixelSize: isSelected ? 10 : isHovered ? 9 : 5,
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
    }, [viewer, asteroids, selectedId, hoveredId, colorMode])

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

      handler.setInputAction(
        (event: { endPosition: { x: number; y: number } }) => {
          const picked = viewer.scene.pick(event.endPosition)
          if (defined(picked) && typeof picked.id === 'string' && !picked.id.startsWith('planet:')) {
            onHover(picked.id)
          } else {
            onHover(null)
          }
        },
        ScreenSpaceEventType.MOUSE_MOVE,
      )

      return () => handler.destroy()
    }, [viewer, asteroids, onSelect, onHover, ref])

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
