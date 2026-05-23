# Glossary

Astronomical and domain-specific terms used in the Asteroid Prospecting Atlas.

---

## Asteroid

A small rocky body that orbits the Sun. Most are in the asteroid belt between Mars and Jupiter. Near-Earth asteroids (NEAs) have orbits that bring them within 1.3 AU of the Sun.

---

## Semi-Major Axis (a)

The average distance between an asteroid and the Sun, representing the size of its orbit. Measured in **astronomical units (AU)**. 1 AU ≈ 149.6 million km (Earth–Sun distance).

---

## Eccentricity (e)

How elliptical an orbit is.

- `e = 0` → perfectly circular
- `e → 1` → highly elongated (comet-like)

Most near-Earth asteroids have `e` between 0.1 and 0.6.

---

## Inclination (i)

The tilt of an asteroid's orbit relative to Earth's orbital plane (the ecliptic). Measured in degrees. High inclination means more energy required to match the asteroid's orbit.

---

## Longitude of Ascending Node (Ω)

The angle in the ecliptic plane between a reference direction and the point where an asteroid's orbit crosses the ecliptic from south to north. Together with argument of periapsis, it orients the orbit in 3D space.

---

## Argument of Periapsis (ω)

The angle between the ascending node and perihelion, measured in the orbital plane. Determines which direction in the orbit the closest approach to the Sun occurs.

---

## Mean Anomaly (M₀)

The fraction of an orbital period elapsed since perihelion, expressed as an angle (0–360°). Used with the Keplerian propagator to compute an asteroid's position at any given time.

---

## Epoch (MJD)

The reference date for an orbit solution, in **Modified Julian Date** (MJD = JD − 2400000.5). Spacekit.js uses Julian Date (JD) natively; the app converts as needed.

---

## Perihelion

The closest point of an orbit to the Sun. `perihelion = a(1 − e)`

---

## Aphelion

The farthest point of an orbit from the Sun. `aphelion = a(1 + e)`

---

## Earth-Crossing Asteroid

An asteroid whose orbit intersects Earth's orbital distance (perihelion ≤ 1.017 AU, aphelion ≥ 0.983 AU). These are both potential hazards and prime mission candidates.

---

## Keplerian Elements

The six numbers that fully describe an elliptical orbit: semi-major axis (a), eccentricity (e), inclination (i), longitude of ascending node (Ω), argument of periapsis (ω), and mean anomaly at epoch (M₀). Given these plus a time, an object's position can be computed analytically.

---

## Keplerian Propagator

An algorithm that converts Keplerian elements + elapsed time into a 3D Cartesian position. The app's propagator (`orbitMechanics.ts`) solves Kepler's equation numerically via Newton–Raphson iteration to find eccentric anomaly, then converts to true anomaly → position vector.

---

## Accessibility Score

A heuristic (0–1) estimating how similar an asteroid's orbit is to Earth's. Computed from weighted differences in semi-major axis, eccentricity, and inclination. Higher score = easier to reach = lower approximate delta-v.

---

## Prospecting Score

A composite score (0–1) combining estimated resource mass (water, silicates, base metals, platinum-group metals) normalised across the full 500-asteroid dataset. Higher score = more promising mining candidate.

---

## Spectral Type

A classification of asteroid surface composition based on reflected light. Key groups:

| Type | Composition | Resources |
|---|---|---|
| C | Carbonaceous, hydrated silicates | Water, organics |
| S | Silicate + metal mix | Iron, nickel, some PGMs |
| M | Metallic (iron-nickel) | Base metals, PGMs |
| X | Uncertain (featureless spectrum) | Unknown |

---

## PGMs (Platinum-Group Metals)

Platinum, palladium, iridium, osmium, rhodium, ruthenium. Extremely rare on Earth; M-type asteroids may contain them in concentrations orders of magnitude higher than terrestrial ore grades.

---

## Delta-v (Δv)

The change in velocity (km/s) required to move between two orbits. The fundamental currency of spaceflight. The accessibility score approximates delta-v; a future version will compute it directly.

---

## AU (Astronomical Unit)

The mean Earth–Sun distance: approximately 149,597,870 km (≈ 149.6 million km). Used as the natural distance unit for inner solar system orbits.
