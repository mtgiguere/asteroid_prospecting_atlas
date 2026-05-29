"""
accessibility.py

Accessibility scoring for asteroid missions relative to Earth.
"""

from asteroid_atlas.analytics.delta_v import estimate_delta_v


def calculate_accessibility_score(
    semi_major_axis_au: float,
    eccentricity: float,
    inclination_deg: float,
) -> float:
    """
    Return the estimated heliocentric delta-v (km/s) to rendezvous with this asteroid.

    Lower values indicate more accessible orbits. A perfectly Earth-like orbit
    (a=1, e=0, i=0) returns 0.0.
    """
    return estimate_delta_v(a=semi_major_axis_au, e=eccentricity, i_deg=inclination_deg)
