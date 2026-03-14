"""
test_jpl_normalization.py
"""

from asteroid_atlas.ingest.jpl_asteroids import normalize_jpl_asteroid
from asteroid_atlas.ingest.models import NormalizedAsteroid


def test_normalize_jpl_asteroid_basic():
    """
    Ensure JPL asteroid JSON is normalized correctly.
    """

    jpl_json = {
        "object": {
            "fullname": "433 Eros",
            "spkid": "2000433",
        }
    }

    result = normalize_jpl_asteroid(jpl_json)

    assert isinstance(result, NormalizedAsteroid)
    assert result.name == "433 Eros"
    assert result.nasa_jpl_id == "2000433"

def test_normalize_jpl_asteroid_extracts_physical_properties():
    jpl_json = {
        "object": {
            "fullname": "433 Eros",
            "spkid": "2000433",
        },
        "phys_par": {
            "H": "10.31",
            "diameter": "16.84",
            "albedo": "0.25",
        },
    }

    asteroid = normalize_jpl_asteroid(jpl_json)

    assert asteroid.name == "433 Eros"
    assert asteroid.nasa_jpl_id == "2000433"
    assert asteroid.absolute_magnitude_h == 10.31
    assert asteroid.estimated_diameter_km == 16.84
    assert asteroid.albedo == 0.25

def test_normalize_jpl_asteroid_allows_missing_physical_properties():
    jpl_json = {
        "object": {
            "fullname": "Test Rock",
            "spkid": "9999999",
        }
    }

    asteroid = normalize_jpl_asteroid(jpl_json)

    assert asteroid.name == "Test Rock"
    assert asteroid.nasa_jpl_id == "9999999"
    assert asteroid.absolute_magnitude_h is None
    assert asteroid.estimated_diameter_km is None
    assert asteroid.albedo is None

    