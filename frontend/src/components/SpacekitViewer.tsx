import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Simulation, Ephem } from 'spacekit.js'
import type { SpaceObject, Coordinate3d } from 'spacekit.js'
import type { AsteroidOrbit, FlyTarget, ColorMode } from '../types'
import { PLANETS } from '../constants/solarSystem'
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

const MJD_TO_JD = 2400000.5
const UNITS_PER_AU = 100

// Project world Coordinate3d → 2D screen pixels via raw matrix math.
// Uses the Three.js camera's projectionMatrix + matrixWorldInverse without
// importing Three.js directly (avoids a bundled-vs-installed instance mismatch).
function projectToScreen(
  pos: Coordinate3d,
  camera: { projectionMatrix: { elements: number[] }; matrixWorldInverse: { elements: number[] } },
  width: number,
  height: number,
): { x: number; y: number; inFront: boolean } {
  const [px, py, pz] = pos
  const mv = camera.matrixWorldInverse.elements
  const vx = mv[0] * px + mv[4] * py + mv[8]  * pz + mv[12]
  const vy = mv[1] * px + mv[5] * py + mv[9]  * pz + mv[13]
  const vz = mv[2] * px + mv[6] * py + mv[10] * pz + mv[14]
  const vw = mv[3] * px + mv[7] * py + mv[11] * pz + mv[15]

  const pm = camera.projectionMatrix.elements
  const cx = pm[0] * vx + pm[4] * vy + pm[8]  * vz + pm[12] * vw
  const cy = pm[1] * vx + pm[5] * vy + pm[9]  * vz + pm[13] * vw
  const cw = pm[3] * vx + pm[7] * vy + pm[11] * vz + pm[15] * vw

  if (cw <= 0) return { x: -9999, y: -9999, inFront: false }
  return {
    x: (cx / cw + 1) / 2 * width,
    y: (1 - cy / cw) / 2 * height,
    inFront: true,
  }
}

export const SpacekitViewer = forwardRef<SolarSystemViewerHandle, Props>(
  function SpacekitViewer(
    { asteroids, selectedId, hoveredId: _hoveredId, colorMode, currentMjd, onSelect, onHover },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const simRef = useRef<Simulation | null>(null)
    const objectsRef = useRef<Map<string, SpaceObject>>(new Map())
    const selectedOrbitRef = useRef<SpaceObject | null>(null)
    const positionsRef = useRef<Map<string, Coordinate3d>>(new Map())
    const asteroidDataRef = useRef<AsteroidOrbit[]>([])

    // Stable ref so canvas listeners can call flyTo without re-registering each render
    const flyToRef = useRef<(target: FlyTarget) => void>(() => {})

    // Mount simulation once
    useEffect(() => {
      if (!containerRef.current) return
      const container = containerRef.current

      const sim = new Simulation(container, {
        basePath: '/spacekit/',
        jd: currentMjd + MJD_TO_JD,
        jdDelta: 0,               // we drive time via setJd()
        unitsPerAu: UNITS_PER_AU,
        camera: {
          initialPosition: [0, -450, 280],
          enableDrift: false,
        },
      })

      sim.createStars()
      sim.createSphere('sol', { color: 0xffee44, radius: 0.05, basePath: '/spacekit/' })

      PLANETS.forEach((p) => {
        sim.createObject(p.id, {
          basePath: '/spacekit/',
          ephem: new Ephem(
            { a: p.sma, e: 0.01, i: 0, om: 0, w: 0, ma: p.angleDeg, epoch: 2451545.0 },
            'deg',
          ),
          theme: { color: parseInt(p.color.replace('#', ''), 16) },
          hideOrbit: false,
        })
      })

      simRef.current = sim

      return () => {
        try { sim.stop() } catch { /* ignore cleanup errors */ }
        simRef.current = null
        objectsRef.current.clear()
        selectedOrbitRef.current = null
        positionsRef.current.clear()
      }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Drive time — one call updates all SpaceObjects
    useEffect(() => {
      simRef.current?.setJd(currentMjd + MJD_TO_JD)
    }, [currentMjd])

    // Rebuild asteroid SpaceObjects when data or color mode changes
    useEffect(() => {
      const sim = simRef.current
      if (!sim) return

      // Remove previous highlight before clearing objects
      if (selectedOrbitRef.current) {
        sim.removeObject(selectedOrbitRef.current)
        selectedOrbitRef.current = null
      }

      objectsRef.current.forEach((obj) => sim.removeObject(obj))
      objectsRef.current.clear()

      let minScore = 0, maxScore = 1
      if (colorMode !== 'spectral_type') {
        const scores = asteroids.map((a) => a[colorMode] as number)
        if (scores.length > 0) {
          minScore = Math.min(...scores)
          maxScore = Math.max(...scores)
        }
      }

      asteroids.forEach((asteroid) => {
        const hex =
          colorMode === 'spectral_type'
            ? spectralTypeGroupToHex(asteroid.resource_profile?.type_group ?? null)
            : scoreToHex(asteroid[colorMode] as number, minScore, maxScore)

        const obj = sim.createObject(asteroid.nasa_jpl_id, {
          basePath: '/spacekit/',
          ephem: new Ephem(
            {
              a: asteroid.semi_major_axis_au,
              e: asteroid.eccentricity,
              i: asteroid.inclination_deg,
              om: asteroid.longitude_of_ascending_node_deg,
              w: asteroid.argument_of_periapsis_deg,
              ma: asteroid.mean_anomaly_deg,
              epoch: asteroid.epoch_mjd + MJD_TO_JD,
            },
            'deg',
          ),
          theme: { color: parseInt(hex.replace('#', ''), 16) },
          hideOrbit: true,
          particleSize: 8,
        })
        objectsRef.current.set(asteroid.nasa_jpl_id, obj)
      })

      asteroidDataRef.current = asteroids

      // Re-create the selection highlight if one is active
      if (selectedId) {
        const sel = asteroids.find((a) => a.nasa_jpl_id === selectedId)
        if (sel) {
          selectedOrbitRef.current = sim.createObject(selectedId + ':sel', {
            basePath: '/spacekit/',
            ephem: new Ephem(
              {
                a: sel.semi_major_axis_au,
                e: sel.eccentricity,
                i: sel.inclination_deg,
                om: sel.longitude_of_ascending_node_deg,
                w: sel.argument_of_periapsis_deg,
                ma: sel.mean_anomaly_deg,
                epoch: sel.epoch_mjd + MJD_TO_JD,
              },
              'deg',
            ),
            theme: { color: 0xffffff, orbitColor: 0x4499ff },
            hideOrbit: false,
            particleSize: 20,
          })
        }
      }
    }, [asteroids, colorMode]) // eslint-disable-line react-hooks/exhaustive-deps

    // Show / hide the selected asteroid highlight when selection changes
    useEffect(() => {
      const sim = simRef.current
      if (!sim) return

      if (selectedOrbitRef.current) {
        sim.removeObject(selectedOrbitRef.current)
        selectedOrbitRef.current = null
      }

      if (!selectedId) return

      const sel = asteroidDataRef.current.find((a) => a.nasa_jpl_id === selectedId)
      if (!sel) return

      selectedOrbitRef.current = sim.createObject(selectedId + ':sel', {
        basePath: '/spacekit/',
        ephem: new Ephem(
          {
            a: sel.semi_major_axis_au,
            e: sel.eccentricity,
            i: sel.inclination_deg,
            om: sel.longitude_of_ascending_node_deg,
            w: sel.argument_of_periapsis_deg,
            ma: sel.mean_anomaly_deg,
            epoch: sel.epoch_mjd + MJD_TO_JD,
          },
          'deg',
        ),
        theme: { color: 0xffffff, orbitColor: 0x4499ff },
        hideOrbit: false,
        particleSize: 20,
      })
    }, [selectedId])

    // Cache positions once per time step — fast picks without re-computing orbital mechanics
    useEffect(() => {
      const sim = simRef.current
      if (!sim) return
      const jd = currentMjd + MJD_TO_JD
      const next = new Map<string, Coordinate3d>()
      objectsRef.current.forEach((obj, id) => next.set(id, obj.getPosition(jd)))
      positionsRef.current = next
    }, [currentMjd, asteroids])

    // Canvas click + hover picking
    useEffect(() => {
      const sim = simRef.current
      if (!sim) return
      const canvas = sim.getRenderer().domElement

      const pick = (mx: number, my: number): string | null => {
        const cam = sim.getViewer().get3jsCamera()
        const rect = canvas.getBoundingClientRect()
        let best: string | null = null
        let bestDist = 20

        positionsRef.current.forEach((pos, id) => {
          const sp = projectToScreen(pos, cam, rect.width, rect.height)
          if (!sp.inFront) return
          const dx = sp.x - mx, dy = sp.y - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < bestDist) { bestDist = dist; best = id }
        })
        return best
      }

      const onClick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        const id = pick(e.clientX - rect.left, e.clientY - rect.top)
        const found = id ? (asteroidDataRef.current.find((a) => a.nasa_jpl_id === id) ?? null) : null
        onSelect(found)
        if (found) flyToRef.current({ kind: 'asteroid', asteroid: found })
      }

      let moveRaf: number | null = null
      const onMouseMove = (e: MouseEvent) => {
        if (moveRaf !== null) cancelAnimationFrame(moveRaf)
        moveRaf = requestAnimationFrame(() => {
          const rect = canvas.getBoundingClientRect()
          onHover(pick(e.clientX - rect.left, e.clientY - rect.top))
          moveRaf = null
        })
      }

      canvas.addEventListener('click', onClick)
      canvas.addEventListener('mousemove', onMouseMove)
      return () => {
        canvas.removeEventListener('click', onClick)
        canvas.removeEventListener('mousemove', onMouseMove)
        if (moveRaf !== null) cancelAnimationFrame(moveRaf)
      }
    }, [onSelect, onHover])

    // Keep flyToRef current every render so canvas listeners always use the latest impl
    flyToRef.current = (target: FlyTarget) => {
      const sim = simRef.current
      if (!sim) return
      const cam = sim.getViewer().get3jsCamera()
      const controls = sim.getViewer().get3jsCameraControls()

      // OrbitControls accumulates sphericalDelta from user interaction. With damping
      // disabled, update() applies then zeroes that delta in one pass. A second
      // update() then snaps the camera to the exact requested position with no residual.
      const snap = (px: number, py: number, pz: number, tx: number, ty: number, tz: number) => {
        controls.enableDamping = false
        cam.position.set(px, py, pz)
        controls.target.set(tx, ty, tz)
        controls.update()   // flushes accumulated sphericalDelta
        cam.position.set(px, py, pz)
        controls.target.set(tx, ty, tz)
        controls.update()   // clean snap with zeroed delta
        controls.enableDamping = true
      }

      if (target.kind === 'sol') {
        snap(0, -180, 120, 0, 0, 0)
        return
      }

      let tx = 0, ty = 0, tz = 0

      if (target.kind === 'planet') {
        const planet = PLANETS.find((p) => p.id === target.planetId)
        if (!planet) return
        const rad = (planet.angleDeg * Math.PI) / 180
        tx = Math.cos(rad) * planet.sma * UNITS_PER_AU
        ty = Math.sin(rad) * planet.sma * UNITS_PER_AU
      } else {
        const obj = objectsRef.current.get(target.asteroid.nasa_jpl_id)
        if (!obj) return
        const pos = obj.getPosition(sim.getJd())
        tx = pos[0]; ty = pos[1]; tz = pos[2]
      }

      const offset = target.kind === 'planet' ? 20 : 30
      snap(tx, ty - offset, tz + offset, tx, ty, tz)
    }

    useImperativeHandle(ref, () => ({
      flyTo(target: FlyTarget) { flyToRef.current(target) },
    }), [])

    return (
      <div
        ref={containerRef}
        data-testid="spacekit-container"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    )
  },
)
