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