"""
accessibility.py

Heuristic scoring for asteroid accessibility relative to Earth's orbit.
"""

from asteroid_atlas.analytics.delta_v import estimate_delta_v_au


def calculate_accessibility_score(
    semi_major_axis_au: float,
    eccentricity: float,
    inclination_deg: float,
) -> float:
    """
    Estimate orbital accessibility relative to Earth.

    Lower scores indicate orbits more similar to Earth's orbit.
    """

    orbital_similarity = (
        abs(semi_major_axis_au - 1.0)
        + eccentricity
        + (inclination_deg / 180.0)
    )

    delta_v = estimate_delta_v_au(semi_major_axis_au)

    score = orbital_similarity + delta_v

    return score