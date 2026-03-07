"""
test_jpl_orbit_normalization.py
"""

from asteroid_atlas.ingest.jpl_asteroids import normalize_jpl_orbit
from asteroid_atlas.ingest.models import NormalizedAsteroidOrbit


def test_normalize_jpl_orbit_basic():
    """
    Ensure JPL orbit JSON is normalized correctly.
    """

    jpl_json = {
        "orbit": {
            "epoch": "60200.5",
            "elements": {
                "a": "1.458",
                "e": "0.223",
                "i": "10.83",
                "om": "304.4",
                "w": "178.7",
                "ma": "42.1",
                "per": "643.2",
            },
        }
    }

    result = normalize_jpl_orbit(jpl_json)

    assert isinstance(result, NormalizedAsteroidOrbit)
    assert result.epoch_mjd == 60200.5
    assert result.semi_major_axis_au == 1.458
    assert result.eccentricity == 0.223
    assert result.inclination_deg == 10.83
    assert result.longitude_of_ascending_node_deg == 304.4
    assert result.argument_of_periapsis_deg == 178.7
    assert result.mean_anomaly_deg == 42.1
    assert result.orbital_period_days == 643.2
