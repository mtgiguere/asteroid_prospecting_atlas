# Asteroid Prospecting Atlas — Overview

The Asteroid Prospecting Atlas is an interactive 3D solar system explorer that ranks real near-Earth asteroids by mining potential. It combines orbital mechanics, planetary science, and resource estimation into a live visualization deployable anywhere.

**[Live Demo →](https://asteroidprospectingatlas-production.up.railway.app)**

---

## What the Atlas Does

- Fetches 500 real near-Earth asteroids from the NASA JPL Small Body Database
- Scores each asteroid on prospecting potential and orbital accessibility
- Classifies asteroids by spectral type (C, S, M, X) with estimated resource masses
- Renders the full solar system in two interactive 3D renderers — Cesium and Spacekit.js
- Time controls let users scrub or animate through real Keplerian orbital positions
- Sidebar navigation with search, filtering, and per-asteroid resource breakdowns

---

## Why This Project Exists

Hundreds of thousands of asteroids orbit the Sun. Some are richer in water, metals, and platinum-group metals than anything on Earth. Some are easier to reach than the Moon. The goal of this project is to make that data explorable and understandable:

- Which asteroids are easiest to reach from Earth?
- Which ones cross Earth's orbit?
- What are they made of, and how much is there?
- Which objects are the best candidates for future exploration or resource extraction?

---

## Current Capabilities

### Data Pipeline
- Ingests real orbital elements and physical properties from NASA JPL SBDB
- Normalises, stores, and scores 500 near-Earth asteroids in PostgreSQL
- Classifies spectral types and estimates resource mass (water, metals, PGMs) per asteroid

### Scoring
- **Prospecting Score (0–1)**: weighted combination of estimated resource mass normalised against the dataset
- **Accessibility Score (0–1)**: orbital similarity to Earth based on semi-major axis, eccentricity, and inclination delta-v approximation

### API
- FastAPI backend with four endpoints: `/ping`, `/asteroids/orbits`, `/asteroids/accessible`, `/asteroids/prospectable`
- CORS-configurable for any deployment environment

### Visualization
Two fully functional 3D renderers, toggled live from the Controls bar:

**Cesium renderer**
- WebGL globe engine adapted for solar system scale
- Multi-layer glow effects for Sun and all planets
- Animated orbit arc on asteroid selection (sweep in, fade out)
- Click-to-select with camera fly-to
- Color modes: prospecting score, accessibility score, spectral type

**Spacekit.js renderer**
- Three.js-based orrery built specifically for solar system visualization
- Keplerian `Ephem` objects — one `sim.setJd()` call updates all 500 asteroid positions
- Selected asteroid highlighted with white glow + blue orbit arc
- Lighter and faster than Cesium for pure orrery use cases

### UX Features
- Time scrubber with play/pause — real orbital mechanics at any date
- Sidebar search across 500 asteroids with spectral type filter
- NavigationSidebar with Sol / planet / asteroid flyTo
- Per-asteroid resource card with Earth-impact equivalencies
- Spectral type legend overlay

---

## Deployment

Hosted on Railway with three services:
- **Backend**: FastAPI / uvicorn on Railway
- **Frontend**: Static Vite build served via `npx serve`
- **Database**: Railway PostgreSQL (500 asteroids seeded from NASA JPL)
