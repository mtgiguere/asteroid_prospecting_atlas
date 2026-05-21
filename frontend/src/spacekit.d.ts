declare module 'spacekit.js' {
  import type * as THREE from 'three'

  export type Coordinate3d = [number, number, number]

  export interface EphemElements {
    a: number      // semi-major axis (AU)
    e: number      // eccentricity
    i: number      // inclination (deg or rad)
    om: number     // longitude of ascending node
    w: number      // argument of periapsis
    ma: number     // mean anomaly at epoch
    epoch: number  // Julian Date
  }

  export class Ephem {
    constructor(elements: EphemElements, unit?: 'deg' | 'rad')
  }

  export interface SpaceObjectOptions {
    ephem?: Ephem
    color?: number
    radius?: number
    labelText?: string
    hideOrbit?: boolean
    basePath?: string
    particleSize?: number
    theme?: { color?: number; orbitColor?: number }
  }

  export class SpaceObject {
    getPosition(jd: number): Coordinate3d
    getId(): string
  }

  export class SphereObject extends SpaceObject {}

  export class Camera {
    get3jsCamera(): THREE.PerspectiveCamera
    get3jsCameraControls(): THREE.OrbitControls
    update(): void
  }

  export interface SimulationContext {
    simulation: Simulation
    options: SpacekitOptions
    objects: {
      renderer: THREE.WebGL1Renderer
      camera: Camera
      scene: THREE.Scene
    }
    container: { width: number; height: number }
  }

  export interface SpacekitOptions {
    basePath: string
    jd?: number
    jdDelta?: number
    jdPerSecond?: number
    startPaused?: boolean
    unitsPerAu?: number
    camera?: {
      initialPosition?: Coordinate3d
      enableDrift?: boolean
    }
  }

  export class Simulation {
    constructor(container: HTMLElement, options: SpacekitOptions)
    createStars(options?: { minSize?: number; maxSize?: number; count?: number }): unknown
    createSphere(id: string, options?: SpaceObjectOptions): SphereObject
    createObject(id: string, options?: SpaceObjectOptions): SpaceObject
    removeObject(obj: SpaceObject): void
    addObject(obj: SpaceObject, noUpdate?: boolean): void
    setJd(val: number): void
    getJd(): number
    getScene(): THREE.Scene
    getRenderer(): THREE.WebGL1Renderer
    getViewer(): Camera
    getContext(): SimulationContext
    zoomToFit(spaceObj: SpaceObject, offset?: number): Promise<boolean>
    start(): void
    stop(): void
  }
}
