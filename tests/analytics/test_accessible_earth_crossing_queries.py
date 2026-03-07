"""
test_accessible_earth_crossing_queries.py
"""

import uuid

from asteroid_atlas.analytics.asteroid_queries import list_most_accessible_asteroids
from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def test_list_most_accessible_earth_crossing_filter():
    """
    Ensure only Earth-crossing asteroids are returned when filter is enabled.
    """

    session = SessionLocal()

    crossing_id = f"TEST-CROSS-{uuid.uuid4()}"
    non_crossing_id = f"TEST-NONCROSS-{uuid.uuid4()}"

    crossing = Asteroid(name="Crossing Asteroid", nasa_jpl_id=crossing_id)
    non_crossing = Asteroid(name="Non-Crossing Asteroid", nasa_jpl_id=non_crossing_id)

    session.add(crossing)
    session.add(non_crossing)
    session.commit()

    crossing_orbit = AsteroidOrbit(
        asteroid_id=crossing.id,
        epoch_mjd=60200.5,
        semi_major_axis_au=1.0,
        eccentricity=0.2,
        inclination_deg=10.0,
        longitude_of_ascending_node_deg=100.0,
        argument_of_periapsis_deg=50.0,
        mean_anomaly_deg=20.0,
        orbital_period_days=365.0,
    )

    non_crossing_orbit = AsteroidOrbit(
        asteroid_id=non_crossing.id,
        epoch_mjd=60200.5,
        semi_major_axis_au=2.5,
        eccentricity=0.1,
        inclination_deg=5.0,
        longitude_of_ascending_node_deg=120.0,
        argument_of_periapsis_deg=40.0,
        mean_anomaly_deg=15.0,
        orbital_period_days=900.0,
    )

    session.add(crossing_orbit)
    session.add(non_crossing_orbit)
    session.commit()

    results = list_most_accessible_asteroids(
        session,
        limit=10,
        nasa_jpl_ids=[crossing_id, non_crossing_id],
        earth_crossing_only=True,
    )

    ids = [row["nasa_jpl_id"] for row in results]

    assert crossing_id in ids
    assert non_crossing_id not in ids

    session.query(AsteroidOrbit).filter(
        AsteroidOrbit.asteroid_id.in_([crossing.id, non_crossing.id])
    ).delete(synchronize_session=False)

    session.query(Asteroid).filter(
        Asteroid.nasa_jpl_id.in_([crossing_id, non_crossing_id])
    ).delete(synchronize_session=False)

    session.commit()
    session.close()