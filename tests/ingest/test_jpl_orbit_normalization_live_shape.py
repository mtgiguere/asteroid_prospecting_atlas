"""
test_jpl_orbit_normalization_live_shape.py
"""

from asteroid_atlas.ingest.jpl_asteroids import normalize_jpl_orbit


def test_normalize_jpl_orbit_with_list_elements_shape():
    """
    Ensure JPL orbit normalization supports the live API list-based elements format.
    """

    jpl_json = {
        "orbit": {
            "epoch": "60200.5",
            "elements": [
                {"name": "a", "value": "1.458"},
                {"name": "e", "value": "0.223"},
                {"name": "i", "value": "10.83"},
                {"name": "om", "value": "304.4"},
                {"name": "w", "value": "178.7"},
                {"name": "ma", "value": "42.1"},
                {"name": "per", "value": "643.2"},
            ],
        }
    }

    result = normalize_jpl_orbit(jpl_json)

    assert result.epoch_mjd == 60200.5
    assert result.semi_major_axis_au == 1.458
    assert result.eccentricity == 0.223
    assert result.inclination_deg == 10.83
    assert result.longitude_of_ascending_node_deg == 304.4
    assert result.argument_of_periapsis_deg == 178.7
    assert result.mean_anomaly_deg == 42.1
    assert result.orbital_period_days == 643.2
