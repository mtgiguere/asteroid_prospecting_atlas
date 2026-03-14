"""
test_prospecting.py
"""

from asteroid_atlas.analytics.prospecting import calculate_prospecting_score


def test_prospecting_score_favors_larger_asteroids_with_same_accessibility():
    """
    Larger asteroids should receive a better (lower) prospecting score
    when accessibility is the same.
    """

    accessibility = 1.2

    small_score = calculate_prospecting_score(
        accessibility_score=accessibility,
        estimated_diameter_km=1.0,
    )

    large_score = calculate_prospecting_score(
        accessibility_score=accessibility,
        estimated_diameter_km=20.0,
    )

    assert large_score < small_score


def test_prospecting_score_handles_missing_diameter():
    """
    Missing diameter should not break scoring.
    """

    score = calculate_prospecting_score(
        accessibility_score=2.0,
        estimated_diameter_km=None,
    )

    assert score == 2.0


def test_prospecting_score_uses_accessibility_as_primary_penalty():
    """
    Worse accessibility should worsen the prospecting score
    when asteroid size is the same.
    """

    diameter = 10.0

    better_access = calculate_prospecting_score(
        accessibility_score=1.0,
        estimated_diameter_km=diameter,
    )

    worse_access = calculate_prospecting_score(
        accessibility_score=3.0,
        estimated_diameter_km=diameter,
    )

    assert better_access < worse_access
