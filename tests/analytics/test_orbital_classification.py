"""
test_orbital_classification.py
"""

from asteroid_atlas.analytics.orbital_classification import is_earth_orbit_crossing


def test_is_earth_orbit_crossing_true():
    """
    Asteroid whose orbit crosses Earth's orbital radius.
    """

    assert (
        is_earth_orbit_crossing(
            perihelion_au=0.9,
            aphelion_au=1.2,
        )
        is True
    )


def test_is_earth_orbit_crossing_false():
    """
    Asteroid completely outside Earth's orbit.
    """

    assert (
        is_earth_orbit_crossing(
            perihelion_au=1.3,
            aphelion_au=2.0,
        )
        is False
    )
