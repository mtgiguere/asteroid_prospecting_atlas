# System Architecture

The Asteroid Prospecting Atlas follows a layered architecture.

```
Ingestion Layer
↓
Database Layer
↓
Analytics Layer
↓
API Layer
↓
Frontend (CesiumJS)
```

## Ingestion Layer

Responsible for retrieving and normalizing asteroid data.

Source:
NASA JPL Small Body Database API

Key module:

```
asteroid_atlas.ingest.jpl_asteroids
```

Functions include:

• fetching asteroid records
• normalizing orbital data
• inserting records into the database

---

## Database Layer

PostgreSQL is used to store asteroid and orbital information.

Tables:

```
asteroids
asteroid_orbits
```

---

## Analytics Layer

The analytics layer calculates derived orbital properties.

Examples:

• perihelion distance
• aphelion distance
• Earth-orbit crossing classification
• accessibility scoring

---

## API Layer

FastAPI exposes the analytics results via HTTP endpoints.

Current endpoints:

```
GET /ping
GET /asteroids/orbits        — full orbital elements + scores for 3D visualization
GET /asteroids/accessible    — ranked by accessibility score
GET /asteroids/prospectable  — ranked by prospecting score
```

All list endpoints accept `limit` and `earth_crossing_only` query parameters.

CORS is enabled for `localhost:5173` (frontend dev server) and `localhost:3000`.

---

## Frontend Layer

A React + TypeScript single-page application that consumes `/asteroids/orbits` to render
an interactive 3D solar system.

Key responsibilities:

• Computing Keplerian orbit paths from orbital elements (client-side, `orbitGeometry.ts`)  
• Rendering orbits, planet rings, and the Sun as Cesium primitives  
• Mapping scores to a green → yellow → red color scale  
• Handling click-to-inspect via Cesium's `ScreenSpaceEventHandler`

Tech: CesiumJS, Resium, Vite. Dev server runs on port 5173.