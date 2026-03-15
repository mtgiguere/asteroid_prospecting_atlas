"""
test_asteroid_metrics_query.py
"""

import uuid

from asteroid_atlas.analytics.asteroid_queries import list_asteroids_with_orbital_metrics
from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def test_list_asteroids_with_orbital_metrics():
    """
    Ensure asteroid queries return derived perihelion and aphelion values.
    """

    session = SessionLocal()
    unique_id = f"TEST-{uuid.uuid4()}"

    asteroid = Asteroid(
        name="Metric Test Asteroid",
        nasa_jpl_id=unique_id,
    )
    session.add(asteroid)
    session.commit()

    orbit = AsteroidOrbit(
        asteroid_id=asteroid.id,
        epoch_mjd=60200.5,
        semi_major_axis_au=1.458,
        eccentricity=0.223,
        inclination_deg=10.83,
        longitude_of_ascending_node_deg=304.4,
        argument_of_periapsis_deg=178.7,
        mean_anomaly_deg=42.1,
        orbital_period_days=643.2,
    )

    session.add(orbit)
    session.commit()

    results = list_asteroids_with_orbital_metrics(session)

    match = next((r for r in results if r["nasa_jpl_id"] == unique_id), None)

    assert match is not None
    assert round(match["perihelion_au"], 3) == 1.133
    assert round(match["aphelion_au"], 3) == 1.783

    session.query(AsteroidOrbit).filter_by(asteroid_id=asteroid.id).delete()
    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()
    session.close()


def test_list_asteroids_with_orbital_metrics_includes_physical_properties():
    """
    Ensure asteroid metric query includes physical asteroid properties.
    """

    session = SessionLocal()
    unique_id = f"TEST-{uuid.uuid4()}"

    asteroid = Asteroid(
        name="Physical Metric Asteroid",
        nasa_jpl_id=unique_id,
        absolute_magnitude_h=12.4,
        estimated_diameter_km=7.8,
        albedo=0.19,
    )
    session.add(asteroid)
    session.commit()

    orbit = AsteroidOrbit(
        asteroid_id=asteroid.id,
        epoch_mjd=60200.5,
        semi_major_axis_au=1.458,
        eccentricity=0.223,
        inclination_deg=10.83,
        longitude_of_ascending_node_deg=304.4,
        argument_of_periapsis_deg=178.7,
        mean_anomaly_deg=42.1,
        orbital_period_days=643.2,
    )

    session.add(orbit)
    session.commit()

    results = list_asteroids_with_orbital_metrics(session)

    match = next((r for r in results if r["nasa_jpl_id"] == unique_id), None)

    assert match is not None
    assert match["absolute_magnitude_h"] == 12.4
    assert match["estimated_diameter_km"] == 7.8
    assert match["albedo"] == 0.19

    session.query(AsteroidOrbit).filter_by(asteroid_id=asteroid.id).delete()
    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()
    session.close()
