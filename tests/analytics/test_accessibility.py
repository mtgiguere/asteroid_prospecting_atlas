"""
test_accessibility.py
"""

from asteroid_atlas.analytics.accessibility import calculate_accessibility_score


def test_calculate_accessibility_score_prefers_earth_like_orbit():
    """
    Asteroids with Earth-like orbits should have lower accessibility scores.
    """

    earth_like = calculate_accessibility_score(
        semi_major_axis_au=1.0,
        eccentricity=0.05,
        inclination_deg=2.0,
    )

    distant = calculate_accessibility_score(
        semi_major_axis_au=2.5,
        eccentricity=0.4,
        inclination_deg=30.0,
    )

    assert earth_like < distant


def test_accessibility_score_is_zero_for_earth_orbit():
    """
    A perfectly Earth-like orbit should yield a score of zero.
    """

    score = calculate_accessibility_score(
        semi_major_axis_au=1.0,
        eccentricity=0.0,
        inclination_deg=0.0,
    )

    assert score == 0.0