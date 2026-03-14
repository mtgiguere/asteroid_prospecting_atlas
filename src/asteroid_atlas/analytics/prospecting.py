"""
prospecting.py

Heuristic scoring for asteroid prospecting potential.
"""


def calculate_prospecting_score(
    accessibility_score: float,
    estimated_diameter_km: float | None,
) -> float:
    """
    Compute a simple prospecting score.

    Lower scores indicate better prospecting targets.
    Larger asteroids receive a bonus.
    """

    size_bonus = (estimated_diameter_km or 0) / 10

    return accessibility_score - size_bonus
