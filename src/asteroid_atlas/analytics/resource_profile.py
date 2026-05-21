"""
resource_profile.py

Derives estimated resource content from asteroid spectral type and diameter.
Composition fractions and densities are based on published estimates
(Kargel 1994; Elvis 2014; Sanchez & Scheeres 2014).
"""

import math
from dataclasses import dataclass, field

# ── Spectral type → group mapping (SMASS/Bus-DeMeo prefixes) ─────────────────
_C_PREFIXES = ("C",)  # C, Ch, Cg, Cgh, Cb, Cgh
_S_PREFIXES = ("S", "Q", "A", "L", "K")  # S, Sq, Sr, Sa, Sk, Sl, Q, A, L, K
_M_PREFIXES = ("M", "E", "P")
_X_PREFIXES = ("X",)  # Xc, Xe, Xk — ambiguous metallic/enstatite/primitive


def _classify(spectral_type: str | None) -> str:
    if spectral_type is None:
        return "unknown"
    t = spectral_type.strip()
    for prefix in _C_PREFIXES:
        if t.startswith(prefix):
            return "C"
    for prefix in _S_PREFIXES:
        if t.startswith(prefix):
            return "S"
    for prefix in _M_PREFIXES:
        if t.startswith(prefix):
            return "M"
    for prefix in _X_PREFIXES:
        if t.startswith(prefix):
            return "X"
    return "other"


# ── Per-group physical parameters ────────────────────────────────────────────
_PARAMS: dict[str, dict] = {
    "C": {
        "density_kg_m3": 1_400,
        "water_fraction": 0.10,
        "metal_fraction": 0.08,
        "pgm_ppm": 0.5,
        "label": "Carbonaceous (C-type)",
        "primary_resources": ["Water ice", "Carbon compounds", "Organic molecules", "Iron/nickel"],
        "why_go_here": (
            "Carbonaceous asteroids are the solar system's water towers. "
            "Mining water here — for fuel depots, life support, or agriculture in space — "
            "means every ton extracted from this rock is a ton Earth's rivers, glaciers, "
            "and aquifers don't have to yield. C-types also carry organic molecules and "
            "volatiles critical for long-duration missions."
        ),
    },
    "S": {
        "density_kg_m3": 2_700,
        "water_fraction": 0.0,
        "metal_fraction": 0.25,
        "pgm_ppm": 10,
        "label": "Silicaceous (S-type)",
        "primary_resources": [
            "Iron",
            "Nickel",
            "Silicate minerals",
            "Platinum-group metals (trace)",
        ],
        "why_go_here": (
            "Silicaceous asteroids are packed with iron, nickel, and olivine — "
            "the structural metals of civilization. Building orbital infrastructure, "
            "lunar bases, or interplanetary vehicles from S-type ore means those "
            "materials never have to be dug out of a mountain on Earth."
        ),
    },
    "M": {
        "density_kg_m3": 5_000,
        "water_fraction": 0.0,
        "metal_fraction": 0.80,
        "pgm_ppm": 100,
        "label": "Metallic (M-type)",
        "primary_resources": ["Nickel-iron", "Platinum", "Palladium", "Iridium", "Cobalt"],
        "why_go_here": (
            "Metallic asteroids are the jackpot. A single mid-sized M-type can contain "
            "more platinum-group metals than humanity has ever mined on Earth. "
            "Redirecting even a fraction of that resource stream off-world "
            "eliminates the need for some of the most ecologically destructive "
            "mining operations on the planet."
        ),
    },
    "X": {
        "density_kg_m3": 3_000,
        "water_fraction": 0.02,
        "metal_fraction": 0.30,
        "pgm_ppm": 30,
        "label": "X-type (ambiguous composition)",
        "primary_resources": [
            "Iron/nickel (likely)",
            "Possible platinum-group metals",
            "Possible volatiles",
        ],
        "why_go_here": (
            "X-types are compositionally ambiguous — they could be metallic, enstatite, "
            "or primitive depending on the specific subtype. A follow-up spectroscopic "
            "observation would sharpen the estimate, but even the conservative baseline "
            "suggests meaningful metal and possible volatile content."
        ),
    },
    "other": {
        "density_kg_m3": 2_000,
        "water_fraction": 0.01,
        "metal_fraction": 0.15,
        "pgm_ppm": 5,
        "label": "Rare/other type",
        "primary_resources": ["Mixed minerals", "Trace metals"],
        "why_go_here": (
            "This asteroid's spectral type falls outside the major groups. "
            "Resource estimates use conservative baseline values; targeted spectroscopy "
            "is recommended before committing to a mission."
        ),
    },
    "unknown": {
        "density_kg_m3": 2_000,
        "water_fraction": 0.01,
        "metal_fraction": 0.15,
        "pgm_ppm": 5,
        "label": "Unknown composition",
        "primary_resources": ["Unknown — spectral data not available"],
        "why_go_here": (
            "No spectral type on record. Resource estimates are rough baselines only. "
            "A flyby or telescopic spectroscopy mission would dramatically improve "
            "the resource picture for this target."
        ),
    },
}


@dataclass
class ResourceProfile:
    spectral_type: str | None
    type_group: str
    type_label: str
    primary_resources: list[str] = field(default_factory=list)
    estimated_mass_kg: float | None = None
    water_mass_kg: float | None = None
    metal_mass_kg: float | None = None
    pgm_mass_kg: float | None = None
    why_go_here: str = ""


def compute_resource_profile(
    spectral_type: str | None,
    diameter_km: float | None,
) -> ResourceProfile:
    group = _classify(spectral_type)
    params = _PARAMS[group]

    if diameter_km is not None:
        radius_m = (diameter_km * 1_000) / 2
        volume_m3 = (4 / 3) * math.pi * radius_m**3
        mass_kg = params["density_kg_m3"] * volume_m3
        water_kg = mass_kg * params["water_fraction"]
        metal_kg = mass_kg * params["metal_fraction"]
        pgm_kg = mass_kg * (params["pgm_ppm"] * 1e-6)
    else:
        mass_kg = water_kg = metal_kg = pgm_kg = None

    return ResourceProfile(
        spectral_type=spectral_type,
        type_group=group,
        type_label=params["label"],
        primary_resources=list(params["primary_resources"]),
        estimated_mass_kg=mass_kg,
        water_mass_kg=water_kg,
        metal_mass_kg=metal_kg,
        pgm_mass_kg=pgm_kg,
        why_go_here=params["why_go_here"],
    )
