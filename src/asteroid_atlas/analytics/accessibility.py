"""
accessibility.py

Heuristic scoring for asteroid accessibility relative to Earth's orbit.
"""


def calculate_accessibility_score(
    semi_major_axis_au: float,
    eccentricity: float,
    inclination_deg: float,
) -> float:
    """
    Estimate orbital accessibility relative to Earth.

    Lower scores indicate orbits more similar to Earth's orbit.
    """

    return abs(semi_major_axis_au - 1.0) + eccentricity + (inclination_deg / 180.0)