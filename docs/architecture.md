# System Architecture

```
NASA JPL SBDB API
       ↓
 Ingestion Layer      asteroid_atlas.ingest
       ↓
  Database Layer      PostgreSQL (asteroids + asteroid_orbits tables)
       ↓
 Analytics Layer      scoring, resource profiles, orbital metrics
       ↓
    API Layer         FastAPI  /asteroids/orbits  /accessible  /prospectable
       ↓
 Frontend Layer       React + TypeScript  (Cesium renderer | Spacekit renderer)
```

---

## Ingestion Layer

**Module**: `asteroid_atlas.ingest.jpl_asteroids`

Fetches up to 500 near-Earth asteroids from the NASA JPL Small Body Database Query API in a single HTTP call. Normalises orbital elements, physical properties, and spectral classifications before bulk-inserting into PostgreSQL.

Run via: `python scripts/seed_db.py [--limit N]`

---

## Database Layer

**Module**: `asteroid_atlas.db`

PostgreSQL via SQLAlchemy. Two tables:

| Table | Contents |
|---|---|
| `asteroids` | identity, physical properties, spectral type, albedo, diameter |
| `asteroid_orbits` | Keplerian elements (a, e, i, Ω, ω, M₀), epoch, period, scores |

Connection string supplied via `DATABASE_URL` env var. The session module normalises `postgresql://` → `postgresql+psycopg://` for psycopg3 compatibility.

---

## Analytics Layer

**Module**: `asteroid_atlas.analytics`

Calculates derived properties on query, not at ingest time:

- **Accessibility score** — orbital similarity to Earth; lower delta-v approximation → higher score
- **Prospecting score** — weighted resource mass (water, silicates, metals, PGMs) normalised across the full dataset
- **Resource profiles** — per-spectral-type composition estimates with Earth-impact equivalencies (e.g. "enough platinum for X years of global EV production")
- **Earth-crossing classification** — perihelion ≤ 1.017 AU and aphelion ≥ 0.983 AU

---

## API Layer

**Module**: `asteroid_atlas.api.main`  
**Runtime**: uvicorn, port from `$PORT` env var  
**Framework**: FastAPI 0.1.0

| Endpoint | Description |
|---|---|
| `GET /ping` | Health check |
| `GET /asteroids/orbits` | Full orbital elements + scores for 3D visualization |
| `GET /asteroids/accessible` | Ranked by accessibility score |
| `GET /asteroids/prospectable` | Ranked by prospecting score |

All list endpoints accept `?limit=N` and `?earth_crossing_only=true`.

CORS origins are configured via the `ALLOWED_ORIGINS` env var (comma-separated). Defaults to `localhost:5173,localhost:3000` for local dev.

---

## Frontend Layer

**Stack**: React 18 + TypeScript, Vite, CesiumJS/Resium, Spacekit.js  
**Dev server**: port 5173  
**Production**: static build served via `npx serve`

### Shared data flow

```
useAsteroids (hook)  →  /asteroids/orbits  →  AsteroidOrbit[]
        ↓
    App.tsx  (state: selectedId, currentMjd, colorMode, rendererMode)
        ↓
 ┌──────────────────────┬─────────────────────┐
 │  SolarSystemViewer   │   SpacekitViewer    │
 │  (Cesium/Resium)     │   (Spacekit.js)     │
 └──────────────────────┴─────────────────────┘
        ↓ shared props & ref API (flyTo)
  Controls │ NavigationSidebar │ AsteroidInfoPanel │ TimeControls
```

### SolarSystemViewer (Cesium)

- `PointPrimitiveCollection` for Sun (4-layer glow), all 5 planets (4-layer glows), and 500 asteroid dots
- `PolylineCollection` for planet orbit rings, asteroid belt context rings, and selected orbit arc
- `ScreenSpaceEventHandler` for click-to-select and hover highlight
- Positions computed client-side via `positionAtMjd()` (Keplerian propagator) on each MJD change
- `camera.flyToBoundingSphere()` for smooth flyTo on selection

### SpacekitViewer (Spacekit.js)

- `Simulation` wraps a Three.js scene; planets and asteroids added as `SpaceObject` with `Ephem` (Keplerian elements)
- `sim.setJd(mjd + 2400000.5)` updates all positions in one call — no per-frame propagation
- Three.js `Raycaster` on `sim.getScene()` for click and hover picking
- Selected asteroid rendered as a second `SpaceObject` with white glow + blue orbit arc

### Renderer toggle

`App.tsx` holds `rendererMode: 'cesium' | 'spacekit'`. Both renderers expose the same `SolarSystemViewerHandle` ref (`flyTo`), so the sidebar, info panel, time controls, and data layer are fully shared.

### Key utilities

| File | Purpose |
|---|---|
| `utils/orbitMechanics.ts` | Keplerian propagator — mean anomaly → eccentric → true → Cartesian |
| `utils/orbitGeometry.ts` | Orbit path point cloud for Cesium polylines |
| `utils/colorScale.ts` | Score → green/yellow/red hex |
| `utils/spectralTypeColor.ts` | Spectral group → color hex |
| `hooks/useOrbitAnimation.ts` | Orbit arc reveal + fade animation state |
| `hooks/useAsteroids.ts` | Fetches and caches asteroid data from the API |

---

## Infrastructure

| Environment | Backend | Frontend | Database |
|---|---|---|---|
| Local dev | uvicorn `--reload` on :8000 | Vite dev server on :5173 | Docker Compose PostgreSQL |
| Production | Railway service (uvicorn, `$PORT`) | Railway service (`npx serve`, port 8080) | Railway PostgreSQL |
