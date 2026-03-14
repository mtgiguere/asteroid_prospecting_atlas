"""
test_models.py
"""

from asteroid_atlas.ingest.models import NormalizedAsteroid


def test_normalized_asteroid_supports_physical_properties():
    asteroid = NormalizedAsteroid(
        name="433 Eros",
        nasa_jpl_id="2000433",
        absolute_magnitude_h=10.31,
        estimated_diameter_km=16.84,
        albedo=0.25,
    )

    assert asteroid.name == "433 Eros"
    assert asteroid.nasa_jpl_id == "2000433"
    assert asteroid.absolute_magnitude_h == 10.31
    assert asteroid.estimated_diameter_km == 16.84
    assert asteroid.albedo == 0.25
