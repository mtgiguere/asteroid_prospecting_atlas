# Asteroid Prospecting Atlas — TODO

---

## Priority 0 — Do First

- [x] **Ingest more real JPL asteroid data** `data`  
  `jpl_bulk.py` uses the JPL SBDB Query API to fetch up to 500 NEAs in one HTTP call. Run `python scripts/seed_db.py [--limit N]` to populate.

---

## Visualization — UX

- [x] **Hide orbit lines by default** `ux`  
  Show only asteroid points on load. Orbits revealed on click. Cleaner starfield view.

- [x] **Animate orbit arc on click** `ux`  
  Sweep animation via Cesium `MaterialProperty`; fade out on deselect.

- [x] **Hover highlight + glow on asteroid points** `ux`  
  Size increase or pulse on mouseover via `ScreenSpaceEventHandler` MOUSE_MOVE.

- [ ] **Floating name labels (Orbitron font)** `ux`  
  Toggle on/off — gets cluttered with 500+ objects.

- [x] **Home / "find asteroids" button** `ux`  
  Covered by NavigationSidebar — Sol / planet / asteroid flyTo via `camera.flyToBoundingSphere`.

- [x] **Search bar → flyTo() selected asteroid** `ux`  
  NavigationSidebar search filters 500 asteroids; click any → smooth camera fly.

- [x] **Spectral type legend overlay** `ux`  
  Small corner legend showing C=blue, S=amber, M=silver, X=purple, unknown=gray. Without it the color coding is meaningless to new users.

- [x] **Resource filter in sidebar** `ux` `science`  
  Let users filter the asteroid list by what they want to harvest — water (C-types), metals (S/M-types), PGMs (M-types). The natural next step from spectral type coloring.

- [ ] **Highlight Earth-orbit crossing point on selected orbit** `ux` `stretch`  
  Mark the exact ecliptic intersection visually. Note: computing the crossing point from Keplerian elements is non-trivial — treat as a stretch goal.

- [x] **Time-based orbit animation** `ux`  
  Cesium is built for this. Show real asteroid positions at a given date; let users scrub through time to watch orbits animate. The most visually striking feature on this list.

- [ ] **Make 3D navigation more user-friendly** `ux` `investigation`  
  Cesium's default mouse controls (drag-to-rotate, right-click-to-zoom, middle-to-pan) are unfamiliar to most users. Investigate: camera inertia tuning, scroll-to-zoom sensitivity, a visible scale indicator, a "reset view" button, and possibly swapping to a more intuitive control scheme. Goal: a first-time user should feel oriented within 10 seconds without reading docs.

---

## Visualization — Planetary Bodies

- [ ] **Earth with texture + slow rotation** `data`  
  NASA free textures; atmosphere glow. Earth is the reference anchor for all scoring and should look like it.

- [x] **Sun glow at origin** `data`  
  Already placed as a point primitive — make it visually prominent (bloom / halo effect).

- [x] **Main asteroid belt context ring** `data`  
  Faint stylized ring between Mars and Jupiter. The solar system looks empty past Mars without it; gives inner-system objects better spatial context.

---

## Scoring / Science

- [ ] **Delta-v estimates** `science`  
  The accessibility score approximates orbital similarity to Earth, but actual estimated delta-v (km/s from Earth) is the scientifically meaningful number for mission planning. Add to the scoring model.

- [x] **Spectral type coloring** `science`  
  C-type (water/organics), S-type (silicates), M-type (metals) have completely different resource profiles. Fetched from JPL `spec_B` field; color-by-spectral-type is now the default view mode.

- [x] **Earth-impact equivalencies in resource card** `science`  
  Replace raw kg values with human-scale comparisons: "enough platinum to supply X years of global EV production", "enough water to sustain a lunar base for Y years." Makes the environmental case visceral rather than abstract.

---

## Engineering

- [x] **API environment config** `engineering`  
  `localhost:8000` is hardcoded in `frontend/src/hooks/useAsteroids.ts`. Switch to a Vite env var (`VITE_API_BASE`) so the frontend can run against any backend.

- [ ] **Enforce TDD on all future features** `tdd`  
  Write the failing test first — always. This is documented in `CLAUDE.md` and must be the first step of every task. See `CLAUDE.md` section 1.

- [x] **Spacekit.js renderer (compare/contrast)** `ux` `engineering`  
  Second renderer toggled live from the Controls bar. Keplerian `Ephem` objects, `sim.setJd()` updates all positions. Side-by-side contrast with Cesium.

- [x] **Railway deployment** `engineering`  
  Backend (FastAPI), frontend (Vite static), and PostgreSQL all running on Railway free tier. CORS and DATABASE_URL configurable via env vars.

- [ ] **Deck.gl frontend (compare/contrast)** `ux` `engineering`  
  Second frontend in `frontend-deckgl/`. Goal is a side-by-side engineering comparison of Deck.gl vs CesiumJS — what each is best at, trade-offs, and when to reach for one vs the other. Useful for technical conversations with other engineers.

---

## Notes

- All new work must follow TDD (see `CLAUDE.md`)
- Never push directly to `main`
- Current test coverage: 100% — keep it that way
