# Asteroid Prospecting Atlas — Frontend

Interactive 3D solar system visualization for the Asteroid Prospecting Atlas. Renders asteroid orbits in real space, color-coded by prospecting or accessibility score, using CesiumJS inside a React application.

---

## Features

- **3D solar system view** — inner planets (Mercury through Jupiter) with orbit rings rendered at true scale in AU
- **Asteroid orbits** — up to 500 asteroids drawn as full Keplerian ellipses, computed client-side from orbital elements
- **Score coloring** — orbits and points color-mapped from green (best) through yellow to red (worst), switchable between prospecting score and accessibility score
- **Click to inspect** — click any asteroid point to open a detail panel showing scores, orbital elements, and physical characteristics
- **Filters** — slider to control how many bodies to load; toggle to show only Earth-crossing asteroids
- **Live API connection** — fetches data from the FastAPI backend at `http://localhost:8000`

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 + TypeScript | UI framework |
| CesiumJS | 3D WebGL space renderer |
| Resium | React component bindings for Cesium |
| Vite | Dev server and bundler |
| vite-plugin-cesium | Cesium asset handling for Vite |

---

## Local Development

**Prerequisites:** Node.js 18+, and the FastAPI backend running on port 8000.

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at http://localhost:5173.

### Other commands

```bash
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

---

## Project Structure

```
frontend/
  src/
    components/
      SolarSystemViewer.tsx   — CesiumJS scene: sun, planet rings, asteroid orbits, mouse picking
      AsteroidInfoPanel.tsx   — slide-in detail panel for a selected asteroid
      Controls.tsx            — top bar with limit slider, filter toggle, and score selector
    hooks/
      useAsteroids.ts         — fetches /asteroids/orbits from the API
    utils/
      orbitGeometry.ts        — Keplerian orbit → Cartesian3 positions (AU → metres)
      colorScale.ts           — score value → hex color (green → yellow → red)
    types.ts                  — AsteroidOrbit interface and ScoreKey type
    App.tsx                   — root component wiring state across all children
  index.html
  vite.config.ts
  package.json
```

---

## API Dependency

The frontend calls one endpoint:

```
GET http://localhost:8000/asteroids/orbits?limit=150&earth_crossing_only=false
```

Returns an array of `AsteroidOrbit` objects. See the root `README.md` for backend setup instructions.
