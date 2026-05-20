# Asteroid Prospecting Atlas — TODO

---

## Priority 0 — Do First

- [ ] **Ingest more real JPL asteroid data** `data`  
  Only 12 bodies locally — need hundreds for the visualization to be meaningful. Expand the ingest pipeline to pull a larger real dataset from NASA JPL.

---

## Visualization — UX

- [ ] **Hide orbit lines by default** `ux`  
  Show only asteroid points on load. Orbits revealed on click. Cleaner starfield view.

- [ ] **Animate orbit arc on click** `ux`  
  Sweep animation via Cesium `MaterialProperty`; fade out on deselect.

- [ ] **Hover highlight + glow on asteroid points** `ux`  
  Size increase or pulse on mouseover via `ScreenSpaceEventHandler` MOUSE_MOVE.

- [ ] **Floating name labels (Orbitron font)** `ux`  
  Toggle on/off — gets cluttered with 500+ objects.

- [ ] **Home / "find asteroids" button** `ux`  
  Auto-zoom to where the data actually is on load. Smooth `flyTo()` on button press.

- [ ] **Search bar → flyTo() selected asteroid** `ux`  
  Smooth cinematic camera fly across the solar system to the matched asteroid.

- [ ] **Highlight Earth-orbit crossing point on selected orbit** `ux` `stretch`  
  Mark the exact ecliptic intersection visually. Note: computing the crossing point from Keplerian elements is non-trivial — treat as a stretch goal.

- [ ] **Time-based orbit animation** `ux`  
  Cesium is built for this. Show real asteroid positions at a given date; let users scrub through time to watch orbits animate. The most visually striking feature on this list.

---

## Visualization — Planetary Bodies

- [ ] **Earth with texture + slow rotation** `data`  
  NASA free textures; atmosphere glow. Earth is the reference anchor for all scoring and should look like it.

- [ ] **Sun glow at origin** `data`  
  Already placed as a point primitive — make it visually prominent (bloom / halo effect).

- [ ] **Main asteroid belt context ring** `data`  
  Faint stylized ring between Mars and Jupiter. The solar system looks empty past Mars without it; gives inner-system objects better spatial context.

---

## Scoring / Science

- [ ] **Delta-v estimates** `science`  
  The accessibility score approximates orbital similarity to Earth, but actual estimated delta-v (km/s from Earth) is the scientifically meaningful number for mission planning. Add to the scoring model.

- [ ] **Spectral type coloring** `science`  
  C-type (water/organics), S-type (silicates), M-type (metals) have completely different resource profiles. Fetch spectral type from JPL and add as a color-by option in the frontend.

---

## Engineering

- [ ] **API environment config** `engineering`  
  `localhost:8000` is hardcoded in `frontend/src/hooks/useAsteroids.ts`. Switch to a Vite env var (`VITE_API_BASE`) so the frontend can run against any backend.

- [ ] **Enforce TDD on all future features** `tdd`  
  Write the failing test first — always. This is documented in `CLAUDE.md` and must be the first step of every task. See `CLAUDE.md` section 1.

- [ ] **Deck.gl frontend (compare/contrast)** `ux` `engineering`  
  Second frontend in `frontend-deckgl/`. Goal is a side-by-side engineering comparison of Deck.gl vs CesiumJS — what each is best at, trade-offs, and when to reach for one vs the other. Useful for technical conversations with other engineers.

---

## Notes

- All new work must follow TDD (see `CLAUDE.md`)
- Never push directly to `main`
- Current test coverage: 100% — keep it that way
