"""
mission_roi.py

Mission cost-benefit analysis for asteroid prospecting targets.
Expresses delta-v as fuel cost and resource value in plain-language terms
so non-technical stakeholders can evaluate mission viability at a glance.
"""

import math

# ── Commodity prices ───────────────────────────────────────────────────────────
# Conservative in-space valuations (USD/kg).
# PGM at platinum spot price; metals at scrap; water at cost-to-orbit proxy.
_PGM_USD_PER_KG = 30_000
_METAL_USD_PER_KG = 10
_WATER_USD_PER_KG = 1_000

# ── Rocket equation constants ──────────────────────────────────────────────────
# Chemical bipropellant (LOX/LH2 or similar), Isp ≈ 450 s
_V_EXHAUST_KMS = 4.41  # km/s  (Isp × g₀)

# ── Mission cost tiers (USD) ───────────────────────────────────────────────────
# Rough order-of-magnitude estimates based on historical NASA/ESA mission budgets.
# Flyby: New Horizons / Dawn class; Rendezvous: OSIRIS-REx class; Sample return: MSR class.
_FLYBY_COST_USD = 300_000_000
_RENDEZVOUS_COST_USD = 800_000_000
_SAMPLE_RETURN_COST_USD = 2_000_000_000


def compute_resource_value_usd(
    water_kg: float | None,
    metal_kg: float | None,
    pgm_kg: float | None,
) -> float:
    """Total estimated resource value in USD at conservative commodity prices."""
    return (
        (water_kg or 0.0) * _WATER_USD_PER_KG
        + (metal_kg or 0.0) * _METAL_USD_PER_KG
        + (pgm_kg or 0.0) * _PGM_USD_PER_KG
    )


def format_value_usd(usd: float) -> str:
    """Human-readable dollar amount: $4.2T, $890.0B, $23.0M."""
    if usd == 0:
        return "$0"
    if usd >= 1e12:
        return f"${usd / 1e12:,.1f}T"
    if usd >= 1e9:
        return f"${usd / 1e9:,.1f}B"
    if usd >= 1e6:
        return f"${usd / 1e6:,.1f}M"
    return f"${usd:,.0f}"


def compute_fuel_fraction(delta_v_kms: float) -> float:
    """
    Fraction of launch mass that must be propellant (Tsiolkovsky rocket equation).
    0 = no fuel needed, approaches 1 for very high delta-v.
    """
    return 1.0 - math.exp(-delta_v_kms / _V_EXHAUST_KMS)


def reach_rating(delta_v_kms: float) -> str:
    """Plain-language mission difficulty based on heliocentric delta-v."""
    if delta_v_kms < 3.5:
        return "EASY REACH"
    if delta_v_kms < 6.0:
        return "MODERATE"
    if delta_v_kms < 9.0:
        return "CHALLENGING"
    return "EXTREME"


def reach_summary(delta_v_kms: float) -> str:
    """One-liner fuel cost statement for non-technical readers."""
    pct = round(compute_fuel_fraction(delta_v_kms) * 100)
    return f"~{pct}% of launch mass must be propellant"


def compute_roi_score(resource_value_usd: float, delta_v_kms: float) -> float:
    """
    Internal ROI score: value per unit of mission energy cost.
    Delta-v is squared because kinetic energy — and thus mission cost — scales
    with velocity squared. Higher score = better target.
    """
    if delta_v_kms == 0:
        return resource_value_usd
    return resource_value_usd / (delta_v_kms**2)


def roi_to_grade(score: float, all_scores: list[float]) -> str:
    """
    Convert a raw ROI score to a plain-language mission grade.
    Grade is percentile-based so it auto-calibrates as the catalog grows.
    """
    if len(all_scores) == 1:
        return "EXCEPTIONAL"
    n = len(all_scores)
    rank = sum(1 for s in all_scores if s <= score)
    percentile = rank / n
    if percentile >= 0.90:
        return "EXCEPTIONAL"
    if percentile >= 0.70:
        return "STRONG"
    if percentile >= 0.40:
        return "MODERATE"
    if percentile >= 0.20:
        return "MARGINAL"
    return "LONG SHOT"


def mission_summary(type_group: str, grade: str, reach: str) -> str:
    """
    One-line plain-English rationale combining resource type, grade, and reach.
    Written for non-scientists: no jargon, no numbers.
    """
    _resource_desc = {
        "C": "water ice and organics",
        "S": "iron, nickel, and silicates",
        "M": "platinum-group metals and nickel-iron",
        "X": "metals and possible volatiles",
        "other": "mixed mineral resources",
        "unknown": "resources unknown — spectral data needed",
    }
    resource = _resource_desc.get(type_group, "mixed resources")

    easy_reach = reach in ("EASY REACH", "MODERATE")
    high_value = grade in ("EXCEPTIONAL", "STRONG")

    if high_value and easy_reach:
        return f"High-value {resource}, within practical mission range."
    if high_value:
        return f"Rich in {resource}, but significant fuel cost to reach."
    if easy_reach:
        return f"Accessible target with moderate {resource}."
    return f"High mission cost limits the return on {resource}."


def _roi_label(ratio: float) -> str:
    """Human-readable cost efficiency: '3.2x return' or '$0.50 per $1 spent'."""
    if ratio >= 1.0:
        return f"{ratio:.1f}x return"
    return f"${ratio:.2f} per $1 spent"


def compute_cost_tiers(resource_value_usd: float) -> dict:
    """
    Tiered mission cost model: flyby / rendezvous / sample return.
    Returns per-tier cost, ROI ratio, labels, and a recommended tier.

    Recommendation thresholds:
      sample_return  — ratio >= 5.0  (value covers cost 5x over)
      rendezvous     — ratio >= 2.0
      flyby          — ratio >= 0.1  (any meaningful characterisation value)
      survey_only    — below flyby threshold
    """
    tiers = {
        "flyby": _FLYBY_COST_USD,
        "rendezvous": _RENDEZVOUS_COST_USD,
        "sample_return": _SAMPLE_RETURN_COST_USD,
    }

    result: dict = {}
    for name, cost in tiers.items():
        ratio = resource_value_usd / cost if cost else 0.0
        result[name] = {
            "cost_usd": cost,
            "cost_label": format_value_usd(cost),
            "roi_ratio": round(ratio, 4),
            "roi_label": _roi_label(round(ratio, 4)),
        }

    sr_ratio = result["sample_return"]["roi_ratio"]
    rz_ratio = result["rendezvous"]["roi_ratio"]
    fb_ratio = result["flyby"]["roi_ratio"]

    if sr_ratio >= 5.0:
        recommended = "sample_return"
    elif rz_ratio >= 2.0:
        recommended = "rendezvous"
    elif fb_ratio >= 0.1:
        recommended = "flyby"
    else:
        recommended = "survey_only"

    result["recommended"] = recommended
    return result
