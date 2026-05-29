# Asteroid Prospecting Atlas — Frontend

Interactive 3D solar system visualization built with React 18 + TypeScript. Two renderer backends are available and can be toggled live from the Controls bar.

---

## Renderers

### Cesium
WebGL globe engine adapted for solar system scale.

- Sun rendered as a multi-layer glow (4 concentric PointPrimitives with varying alpha)
- Planets rendered as multi-layer glows with true positions computed from Keplerian elements at the current MJD
- Earth rendered as a rotating textured ellipsoid with atmosphere glow
- Planet orbit rings and asteroid belt boundary rings rendered as PolylineCollections
- Asteroid orbit arc on selection (animates in, fades out on deselect)
- Hohmann transfer arc from Earth to selected asteroid
- Click picking via ScreenSpaceEventHandler → flyTo camera animation

### Spacekit.js
Three.js orrery purpose-built for solar system visualization (by a JPL engineer).

- Asteroids declared as `Ephem` (Keplerian elements) objects — Spacekit advances positions automatically on `sim.setJd()`
- One `setJd()` call per time step updates all 500 asteroid positions; no per-frame orbit math
- Selected asteroid highlighted with white glow and blue orbit arc
- Lighter and faster than Cesium for pure orrery use cases

---

## Features

- **Renderer toggle** — switch between Cesium and Spacekit live from the Controls bar; both share the same props and ref API
- **Time scrubber** — play/pause and scrub through real dates; all orbital positions update from Keplerian elements
- **Score color modes** — color asteroids by Prospecting Score, Accessibility Score, or Spectral Type; color key overlay explains the mapping
- **Sidebar navigation** — search across all 500 asteroids, filter by spectral type group (C / S / M / X), flyTo Sol / any planet / any asteroid
- **Asteroid info panel** — resource profile (water / metals / PGM mass), mission ROI (flyby / rendezvous / sample return tiers with ROI ratios), launch window, and orbital elements
- **Earth-crossing filter** — toggle to show only asteroids that cross Earth's orbit
- **Limit slider** — control how many asteroids load (10–500)

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 + TypeScript | UI framework |
| CesiumJS + Resium | 3D WebGL space renderer (Cesium renderer) |
| Spacekit.js | Three.js solar system orrery (Spacekit renderer) |
| Vite + vite-plugin-cesium | Dev server, bundler, Cesium asset handling |
| Vitest + React Testing Library | Unit and component tests |

---

## Local Development

**Prerequisites:** Node.js 18+, FastAPI backend running on port 8000.

```bash
cd frontend
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npx vitest run    # run tests
```

Set `VITE_API_BASE` if the backend is not at `http://localhost:8000`:

```bash
VITE_API_BASE=https://my-backend.example.com npm run dev
```

---

## Project Structure

```
frontend/src/
  components/
    SolarSystemViewer.tsx       Cesium renderer: sun, planets, orbit rings, asteroid points, picking
    SpacekitViewer.tsx          Spacekit.js renderer: Ephem-based orrery
    AsteroidInfoPanel.tsx       Slide-in detail panel: resource profile, mission ROI, launch window
    NavigationSidebar.tsx       Search, spectral filter, flyTo list
    Controls.tsx                Top bar: limit slider, filter toggle, color mode, renderer toggle
    SpectralTypeLegend.tsx      Color key overlay for spectral type mode
  hooks/
    useAsteroids.ts             Fetches /asteroids/orbits from the API
    useOrbitAnimation.ts        Manages orbit arc sweep/fade animation state
  utils/
    orbitGeometry.ts            Keplerian elements → Cartesian3 positions (AU → metres)
    orbitMechanics.ts           positionAtMjd, planetAngleDeg, earthRotationRad
    colorScale.ts               Score value → hex color (green → yellow → red)
    spectralTypeColor.ts        Spectral type group → hex color
    missionCompanions.ts        Suggest complementary asteroid targets for multi-stop missions
  constants/
    solarSystem.ts              PLANETS array with SMA, period, J2000 longitude
  spacekit.d.ts                 TypeScript module declaration for spacekit.js
  types.ts                      AsteroidOrbit, FlyTarget, ColorMode, RendererMode interfaces
  App.tsx                       Root component: state management, renderer switching
```

---

## API Dependency

The frontend calls one primary endpoint:

```
GET /asteroids/orbits?limit=500&earth_crossing_only=false
```

Returns an array of `AsteroidOrbit` objects including orbital elements, physical properties, resource profile, mission ROI, and launch window data. See the root `README.md` for backend setup.
