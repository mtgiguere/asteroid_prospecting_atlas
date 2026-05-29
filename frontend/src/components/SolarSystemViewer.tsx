import { useEffect, useCallback, useState, useRef, forwardRef, useImperativeHandle } from 'react'
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
  Quaternion,
  Matrix3,
  Matrix4,
  EllipsoidGeometry,
  GeometryInstance,
  Primitive,
  PerInstanceColorAppearance,
  ColorGeometryInstanceAttribute,
  defined,
  type Viewer as CesiumViewer,
} from 'cesium'
import type { AsteroidOrbit, FlyTarget, ColorMode } from '../types'
import { PLANETS } from '../constants/solarSystem'
import { orbitToCartesian3, eclipticCircle, hohmannTransferPoints, AU_M } from '../utils/orbitGeometry'
import { positionAtMjd, earthRotationRad, planetAngleDeg } from '../utils/orbitMechanics'
import { useOrbitAnimation } from '../hooks/useOrbitAnimation'
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
  currentMjd: number
  onSelect: (asteroid: AsteroidOrbit | null) => void
  onHover: (id: string | null) => void
}

export const SolarSystemViewer = forwardRef<SolarSystemViewerHandle, Props>(
  function SolarSystemViewer({ asteroids, selectedId, hoveredId, colorMode, currentMjd, onSelect, onHover }, ref) {
    const [viewer, setViewer] = useState<CesiumViewer | null>(null)
    const { displayId, fadeAlpha } = useOrbitAnimation(selectedId)
    const currentMjdRef = useRef(currentMjd)
    useEffect(() => { currentMjdRef.current = currentMjd }, [currentMjd])

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
            position = new Cartesian3(7e6, 0, 0)
            radius = 1.8e11
          } else if (target.kind === 'planet') {
            const planet = PLANETS.find((p) => p.id === target.planetId)
            if (!planet) return
            const deg = planetAngleDeg(planet.angleDeg, planet.periodDays, currentMjdRef.current)
            const rad = (deg * Math.PI) / 180
            position = new Cartesian3(
              Math.cos(rad) * planet.sma * AU_M,
              Math.sin(rad) * planet.sma * AU_M,
              0,
            )
            radius = planet.sma * AU_M * 0.15
          } else {
            const raw = positionAtMjd({
              semiMajorAxisAu: target.asteroid.semi_major_axis_au,
              eccentricity: target.asteroid.eccentricity,
              inclinationDeg: target.asteroid.inclination_deg,
              lonAscNodeDeg: target.asteroid.longitude_of_ascending_node_deg,
              argPeriapsisDeg: target.asteroid.argument_of_periapsis_deg,
              epochMjd: target.asteroid.epoch_mjd,
              meanAnomalyDeg: target.asteroid.mean_anomaly_deg,
              periodDays: target.asteroid.orbital_period_days,
            }, currentMjdRef.current)
            position = new Cartesian3(raw.x, raw.y, raw.z)
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

      // Explicit direction toward the Sun at the origin avoids heading/pitch ambiguity
      const camPos = new Cartesian3(0, -4.5e11, 2.8e11)
      const camDir = Cartesian3.normalize(
        Cartesian3.subtract(Cartesian3.ZERO, camPos, new Cartesian3()),
        new Cartesian3(),
      )
      viewer.camera.setView({
        destination: camPos,
        orientation: { direction: camDir, up: new Cartesian3(0, 0, 1) },
      })

      const controller = viewer.scene.screenSpaceCameraController
      controller.zoomFactor = 2.0          // default 5.0 — much too fast at AU scale
      controller.minimumZoomDistance = 1e8 // ~0.001 AU — close enough to inspect a rock

      // Sol — offset 7 Mm from origin so Cesium's horizon culling (WGS84 ellipsoid
      // radius ≈ 6371 km) doesn't occlude it. 7e6 m is invisible at AU scale.
      const SUN_POS = new Cartesian3(7e6, 0, 0)
      const sunPoints = new PointPrimitiveCollection()
      sunPoints.add({ position: SUN_POS, color: Color.fromCssColorString('#ff9900').withAlpha(0.08), pixelSize: 200, disableDepthTestDistance: Number.POSITIVE_INFINITY })
      sunPoints.add({ position: SUN_POS, color: Color.fromCssColorString('#ffee66').withAlpha(0.18), pixelSize: 120, disableDepthTestDistance: Number.POSITIVE_INFINITY })
      sunPoints.add({ position: SUN_POS, color: Color.fromCssColorString('#fff5aa').withAlpha(0.6),  pixelSize: 60,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
      sunPoints.add({ position: SUN_POS, color: Color.fromCssColorString('#ffffff'),                 pixelSize: 28,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
      scene.primitives.add(sunPoints)

      // Sol label
      const sunLabel = new LabelCollection()
      sunLabel.add({
        position: SUN_POS,
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

      return () => {
        if (!viewer.isDestroyed()) {
          scene.primitives.remove(sunPoints)
          scene.primitives.remove(sunLabel)
        }
      }
    }, [viewer])

    // All planets — multi-layer glows + labels; re-runs when time advances so planets move
    useEffect(() => {
      if (!viewer) return

      const scene = viewer.scene
      const allPlanetPoints = new PointPrimitiveCollection()
      const planetLabels = new LabelCollection()

      PLANETS.forEach((p) => {
        const deg = planetAngleDeg(p.angleDeg, p.periodDays, currentMjd)
        const rad = (deg * Math.PI) / 180
        const pos = new Cartesian3(Math.cos(rad) * p.sma * AU_M, Math.sin(rad) * p.sma * AU_M, 0)
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

        if (p.id === 'mercury') {
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#aaaaaa').withAlpha(0.12), pixelSize: 60,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#bbbbbb').withAlpha(0.42), pixelSize: 32,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#cccccc').withAlpha(0.80), pixelSize: 16,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#dddddd'),                 pixelSize: 8,   disableDepthTestDistance: Number.POSITIVE_INFINITY, id: 'planet:mercury' })
        } else if (p.id === 'venus') {
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#c8a840').withAlpha(0.13), pixelSize: 80,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#d8bc60').withAlpha(0.44), pixelSize: 42,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#ecd880').withAlpha(0.82), pixelSize: 22,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#f0d080'),                 pixelSize: 10,  disableDepthTestDistance: Number.POSITIVE_INFINITY, id: 'planet:venus' })
        } else if (p.id === 'earth') {
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#1a4a8a').withAlpha(0.20), pixelSize: 140, disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#2266bb').withAlpha(0.45), pixelSize: 72,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#55aaee').withAlpha(0.80), pixelSize: 42,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#cceeff'),                 pixelSize: 22,  disableDepthTestDistance: Number.POSITIVE_INFINITY, id: 'planet:earth' })
        } else if (p.id === 'mars') {
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#8a2a1a').withAlpha(0.12), pixelSize: 70,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#cc4422').withAlpha(0.40), pixelSize: 36,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#ee7755').withAlpha(0.78), pixelSize: 18,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#ff8866'),                 pixelSize: 9,   disableDepthTestDistance: Number.POSITIVE_INFINITY, id: 'planet:mars' })
        } else if (p.id === 'jupiter') {
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#7a5c33').withAlpha(0.18), pixelSize: 150, disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#aa8855').withAlpha(0.42), pixelSize: 84,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#ccaa77').withAlpha(0.80), pixelSize: 48,  disableDepthTestDistance: Number.POSITIVE_INFINITY })
          allPlanetPoints.add({ position: pos, color: Color.fromCssColorString('#eecc99'),                 pixelSize: 30,  disableDepthTestDistance: Number.POSITIVE_INFINITY, id: 'planet:jupiter' })
        }
      })

      // Planet orbit rings — live here (not in [viewer] effect) so Cesium renders them reliably
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

      // Main asteroid belt context rings (2.2–3.2 AU, faint grey)
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

      scene.primitives.add(allPlanetPoints)
      scene.primitives.add(planetLabels)

      return () => {
        if (!viewer.isDestroyed()) {
          scene.primitives.remove(planetLines)
          scene.primitives.remove(beltLines)
          scene.primitives.remove(allPlanetPoints)
          scene.primitives.remove(planetLabels)
        }
      }
    }, [viewer, currentMjd])

    // Earth — rotating sphere with atmosphere glow; position tracked from currentMjd
    useEffect(() => {
      if (!viewer) return
      const scene = viewer.scene

      const earth = PLANETS.find((p) => p.id === 'earth')!
      const deg = planetAngleDeg(earth.angleDeg, earth.periodDays, currentMjd)
      const rad = (deg * Math.PI) / 180
      const earthPos = new Cartesian3(
        Math.cos(rad) * earth.sma * AU_M,
        Math.sin(rad) * earth.sma * AU_M,
        0,
      )

      const EARTH_RADIUS = 2e9
      const TILT = (23.45 * Math.PI) / 180
      const tiltAxis = Cartesian3.normalize(
        new Cartesian3(Math.sin(TILT), 0, Math.cos(TILT)),
        new Cartesian3(),
      )

      const buildMatrix = (angle: number): Matrix4 =>
        Matrix4.fromRotationTranslation(
          Matrix3.fromQuaternion(Quaternion.fromAxisAngle(tiltAxis, angle)),
          earthPos,
        )

      const earthSphere = scene.primitives.add(
        new Primitive({
          geometryInstances: new GeometryInstance({
            geometry: new EllipsoidGeometry({
              radii: new Cartesian3(EARTH_RADIUS, EARTH_RADIUS, EARTH_RADIUS),
              vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
            }),
            attributes: {
              color: ColorGeometryInstanceAttribute.fromColor(Color.fromCssColorString('#1a4f8c')),
            },
          }),
          appearance: new PerInstanceColorAppearance({ translucent: false, flat: true }),
          modelMatrix: buildMatrix(earthRotationRad(currentMjdRef.current)),
          asynchronous: false,
        }),
      )

      const atmosphere = scene.primitives.add(
        new Primitive({
          geometryInstances: new GeometryInstance({
            geometry: new EllipsoidGeometry({
              radii: new Cartesian3(EARTH_RADIUS * 1.08, EARTH_RADIUS * 1.08, EARTH_RADIUS * 1.08),
              vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT,
            }),
            attributes: {
              color: ColorGeometryInstanceAttribute.fromColor(Color.fromCssColorString('#4499ff').withAlpha(0.07)),
            },
          }),
          appearance: new PerInstanceColorAppearance({ translucent: true, flat: true }),
          modelMatrix: Matrix4.fromTranslation(earthPos),
          asynchronous: false,
        }),
      )

      // Transparent point keeps the existing string-id click handler working
      const pickPoints = new PointPrimitiveCollection()
      pickPoints.add({
        position: earthPos,
        color: Color.TRANSPARENT,
        pixelSize: 28,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        id: 'planet:earth',
      })
      scene.primitives.add(pickPoints)

      // Update rotation each frame via preRender
      const stopRotation = scene.preRender.addEventListener(() => {
        if (!earthSphere.isDestroyed()) {
          earthSphere.modelMatrix = buildMatrix(earthRotationRad(currentMjdRef.current))
        }
      })

      return () => {
        stopRotation()
        if (!viewer.isDestroyed()) {
          scene.primitives.remove(earthSphere)
          scene.primitives.remove(atmosphere)
          scene.primitives.remove(pickPoints)
        }
      }
    }, [viewer, currentMjd])

    // Asteroid points — re-runs when data, date, or colors change
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

      const asteroidPoints = new PointPrimitiveCollection()

      asteroids.forEach((asteroid) => {
        const isSelected = asteroid.nasa_jpl_id === displayId
        const isHovered = asteroid.nasa_jpl_id === hoveredId
        const hex =
          colorMode === 'spectral_type'
            ? spectralTypeGroupToHex(asteroid.resource_profile?.type_group ?? null)
            : scoreToHex(asteroid[colorMode], minScore, maxScore)
        const color = Color.fromCssColorString(hex)

        const rawPos = positionAtMjd({
          semiMajorAxisAu: asteroid.semi_major_axis_au,
          eccentricity: asteroid.eccentricity,
          inclinationDeg: asteroid.inclination_deg,
          lonAscNodeDeg: asteroid.longitude_of_ascending_node_deg,
          argPeriapsisDeg: asteroid.argument_of_periapsis_deg,
          epochMjd: asteroid.epoch_mjd,
          meanAnomalyDeg: asteroid.mean_anomaly_deg,
          periodDays: asteroid.orbital_period_days,
        }, currentMjd)

        asteroidPoints.add({
          position: new Cartesian3(rawPos.x, rawPos.y, rawPos.z),
          color: isHovered ? Color.WHITE : color,
          pixelSize: isSelected ? 10 : isHovered ? 9 : 5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          id: asteroid.nasa_jpl_id,
        })
      })

      scene.primitives.add(asteroidPoints)

      return () => {
        if (!viewer.isDestroyed()) scene.primitives.remove(asteroidPoints)
      }
    }, [viewer, asteroids, displayId, hoveredId, colorMode, currentMjd])

    // Selected orbit — full path, persistent while selected, fades on deselect
    useEffect(() => {
      if (!viewer || !displayId) return

      const asteroid = asteroids.find((a) => a.nasa_jpl_id === displayId)
      if (!asteroid) return

      const scene = viewer.scene
      const hex =
        colorMode === 'spectral_type'
          ? spectralTypeGroupToHex(asteroid.resource_profile?.type_group ?? null)
          : scoreToHex(asteroid[colorMode], 0, 1)
      const color = Color.fromCssColorString(hex)

      const orbitLines = new PolylineCollection()
      orbitLines.add({
        positions: orbitToCartesian3(
          asteroid.semi_major_axis_au,
          asteroid.eccentricity,
          asteroid.inclination_deg,
          asteroid.longitude_of_ascending_node_deg,
          asteroid.argument_of_periapsis_deg,
        ),
        width: 3,
        material: Material.fromType(Material.ColorType, {
          color: color.withAlpha(fadeAlpha),
        }),
      })

      scene.primitives.add(orbitLines)

      return () => {
        if (!viewer.isDestroyed()) scene.primitives.remove(orbitLines)
      }
    }, [viewer, asteroids, displayId, fadeAlpha, colorMode])

    // Hohmann transfer arc — orange semi-ellipse from Earth's current position to selected asteroid
    useEffect(() => {
      if (!viewer || !displayId) return

      const asteroid = asteroids.find((a) => a.nasa_jpl_id === displayId)
      if (!asteroid) return

      const scene = viewer.scene
      const earth = PLANETS.find((p) => p.id === 'earth')!
      const earthLonDeg = planetAngleDeg(earth.angleDeg, earth.periodDays, currentMjd)

      const hohmannLines = new PolylineCollection()
      hohmannLines.add({
        positions: hohmannTransferPoints(earthLonDeg, asteroid.semi_major_axis_au),
        width: 2,
        material: Material.fromType(Material.ColorType, {
          color: Color.fromCssColorString('#ff8833').withAlpha(fadeAlpha * 0.75),
        }),
      })

      scene.primitives.add(hohmannLines)

      return () => {
        if (!viewer.isDestroyed()) scene.primitives.remove(hohmannLines)
      }
    }, [viewer, asteroids, displayId, fadeAlpha, currentMjd])

    // Click picking — select asteroid or planet, then flyTo
    useEffect(() => {
      if (!viewer) return

      const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)

      handler.setInputAction(
        (event: { position: { x: number; y: number } }) => {
          const picked = viewer.scene.pick(new Cartesian2(event.position.x, event.position.y))
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
          const picked = viewer.scene.pick(new Cartesian2(event.endPosition.x, event.endPosition.y))
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
