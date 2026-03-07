"""
test_asteroid_orbit_model.py
"""

from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def test_asteroid_orbit_model_fields():
    """
    Ensure the AsteroidOrbit model exposes the expected fields.
    """

    orbit = AsteroidOrbit(
        asteroid_id=1,
        epoch_mjd=60200.5,
        semi_major_axis_au=1.458,
        eccentricity=0.223,
        inclination_deg=10.83,
        longitude_of_ascending_node_deg=304.4,
        argument_of_periapsis_deg=178.7,
        mean_anomaly_deg=42.1,
        orbital_period_days=643.2,
    )

    assert orbit.asteroid_id == 1
    assert orbit.epoch_mjd == 60200.5
    assert orbit.semi_major_axis_au == 1.458
    assert orbit.eccentricity == 0.223
    assert orbit.inclination_deg == 10.83
    assert orbit.longitude_of_ascending_node_deg == 304.4
    assert orbit.argument_of_periapsis_deg == 178.7
    assert orbit.mean_anomaly_deg == 42.1
    assert orbit.orbital_period_days == 643.2
