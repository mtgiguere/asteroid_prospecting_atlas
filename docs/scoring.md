# Scoring & Valuation Methodology

## TL;DR

The dollar estimates are large because asteroids are large. A 34 km asteroid contains more iron and nickel than all of human civilization has ever processed, and more platinum than Earth's entire known reserves — many times over. The model applies conservative commodity prices to those estimated masses. The numbers are not a bug.

---

## Prospecting Score

Each asteroid receives a **Prospecting Score** (0–1) that combines:

1. **Resource value** — estimated total USD value of water, base metals, and platinum-group metals (see valuation below)
2. **Accessibility** — orbital similarity to Earth expressed as delta-v cost in km/s

The raw score is:

```
roi_score = resource_value_usd / (delta_v_kms²)
```

Delta-v is squared because mission energy — and therefore cost — scales with velocity squared. A high-value asteroid that requires twice the delta-v costs roughly four times as much to reach.

Scores are then normalized percentile-wise across the full 500-asteroid catalog, so the score reflects how a target compares to the real dataset, not an arbitrary scale. This means the top-scoring asteroid always gets 1.0, and the distribution auto-calibrates as new data is added.

---

## Accessibility Score

The **Accessibility Score** (0–1) measures how easy an asteroid is to reach from Earth orbit, based on heliocentric delta-v. Lower delta-v = higher score.

Delta-v is approximated from orbital elements using the Edelbaum / Shoemaker-Helin formulation:

```
Δv ≈ √[ Δv_a² + Δv_e² + Δv_i² ]
```

where each term penalises deviation from Earth's orbit in semi-major axis, eccentricity, and inclination respectively. The score is again percentile-normalized across the catalog.

---

## Resource Valuation

This is where the large numbers come from.

### Step 1 — Spectral type → composition

Each spectral type maps to a density and composition based on published planetary science literature (Kargel 1994; Elvis 2014; Sanchez & Scheeres 2014):

| Type | Description | Density (kg/m³) | Water | Metals | PGM |
|------|-------------|-----------------|-------|--------|-----|
| **C** | Carbonaceous | 1,400 | 10% | 8% | 0.5 ppm |
| **S** | Silicaceous | 2,700 | 0% | 25% | 10 ppm |
| **M** | Metallic | 5,000 | 0% | 80% | 100 ppm |
| **X** | X-type (ambiguous) | 3,000 | 2% | 30% | 30 ppm |
| Unknown | — | 2,000 | 1% | 15% | 5 ppm |

"Metals" means nickel-iron. "PGM" means platinum-group metals (platinum, palladium, iridium, osmium, rhodium, ruthenium) — the same metals used in catalytic converters, fuel cells, and electronics.

### Step 2 — Diameter → mass

Asteroids are modelled as spheres. Given a diameter `d` in km:

```
radius_m  = d × 500
volume_m3 = (4/3) × π × radius_m³
mass_kg   = density × volume_m3
```

This is where the numbers get large fast. Volume scales with radius **cubed** — a 34 km asteroid has roughly 6,000× the volume of a 1 km asteroid.

### Step 3 — Mass → resource content

```
water_kg = mass_kg × water_fraction
metal_kg = mass_kg × metal_fraction
pgm_kg   = mass_kg × (pgm_ppm × 1e-6)
```

### Step 4 — Resource content → USD

```
value_usd = (water_kg × $1,000) + (metal_kg × $10) + (pgm_kg × $30,000)
```

Commodity prices used:

| Resource | USD/kg | Basis |
|----------|--------|-------|
| Platinum-group metals | $30,000 | Platinum spot price (conservative — palladium and rhodium trade higher) |
| Base metals (iron/nickel) | $10 | Scrap metal pricing |
| Water | $1,000 | Cost-to-orbit proxy (fuel depot replacement value, not Earth tap water) |

---

## Why Is 1036 Ganymed Worth $200+ Trillion?

Let's walk through it.

**1036 Ganymed** is the largest near-Earth asteroid: approximately 34 km in diameter, S-type (silicaceous).

**Step 1** — S-type parameters: density 2,700 kg/m³, 25% metals, 10 ppm PGM.

**Step 2** — Mass:
```
radius = 17,000 m
volume = (4/3) × π × 17,000³ ≈ 2.06 × 10¹³ m³
mass   = 2,700 × 2.06 × 10¹³ ≈ 5.56 × 10¹⁶ kg
                               = ~55 trillion kg
```

**Step 3** — Resource content:
```
metal_kg = 5.56 × 10¹⁶ × 0.25 ≈ 1.39 × 10¹⁶ kg  (13.9 trillion kg of iron/nickel)
pgm_kg   = 5.56 × 10¹⁶ × 10e-6 ≈ 5.56 × 10¹¹ kg  (556 billion kg of PGMs)
```

**Step 4** — Valuation:
```
metal value = 1.39 × 10¹⁶ kg × $10/kg        ≈  $139 trillion
PGM value   = 5.56 × 10¹¹ kg × $30,000/kg    ≈  $16.7 trillion
──────────────────────────────────────────────────────────────
Total                                          ≈  $156 trillion
```

The exact figure varies depending on what diameter NASA JPL reports at any given time, but the order of magnitude is right.

**Why is the PGM line so large?** 10 ppm sounds negligible. But applied to 55 trillion kg of rock, it yields 556 billion kg of platinum-group metals. Earth's total known platinum reserves are approximately 66,000 tonnes (66 million kg). Global annual production is around 180 tonnes. Ganymed contains roughly 8,000× Earth's total reserves — and at $30,000/kg, even a tiny fraction of that dominates the valuation.

---

## What These Numbers Mean

They represent **theoretical total resource content at current commodity prices** — a ceiling on extractable value, not a business plan.

In practice:
- **Extraction technology for asteroid mining does not yet exist** at commercial scale
- **Bringing large quantities of PGMs or iron to Earth would collapse those commodity markets** — the more you extract, the less each kilogram is worth
- **The real near-term case for asteroid resources is in-space use**: water split into hydrogen/oxygen for propellant, metals for on-orbit construction, reducing the need to launch everything from Earth's gravity well

The valuations are useful for **relative ranking** — identifying which objects have compelling resource cases, which types are worth targeting for which missions, and which targets justify the mission cost. A $200T valuation vs a $2B valuation is a meaningful signal even if neither number will ever appear on a balance sheet.

---

## Mission Grades

Mission grade translates the raw ROI ratio into a plain-language label:

| Grade | Percentile in catalog |
|-------|----------------------|
| EXCEPTIONAL | Top 10% |
| STRONG | 70th–90th percentile |
| MODERATE | 40th–70th percentile |
| MARGINAL | 20th–40th percentile |
| LONG SHOT | Bottom 20% |

---

## Mission Cost Tiers

Rough order-of-magnitude budgets based on historical NASA/ESA mission costs:

| Mission type | Budget estimate | Example |
|---|---|---|
| Flyby | $300M | New Horizons class |
| Rendezvous | $800M | OSIRIS-REx class |
| Sample return | $2B | Mars Sample Return class |

The recommended tier is the cheapest one where resource value covers cost by at least 5× (sample return), 2× (rendezvous), or 0.1× (flyby — any meaningful characterization value). Below 0.1× ROI: survey only.

---

## References

- Kargel, J.S. (1994). Metalliferous asteroids as potential sources of precious metals. *Journal of Geophysical Research: Planets*, 99(E10), 21129–21141.
- Elvis, M. (2014). How many ore-bearing asteroids? *Planetary and Space Science*, 91, 20–26.
- Sanchez, J.P. & Scheeres, D.J. (2014). The limiting sculpting effect of spacecraft propulsion on small bodies. *Acta Astronautica*, 94, 769–776.
