"""
test_accessible_asteroid_queries.py
"""

import uuid

from asteroid_atlas.analytics.asteroid_queries import list_most_accessible_asteroids
from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def test_list_most_accessible_asteroids_orders_by_score():
    """
    Ensure asteroids are ordered from most accessible to least accessible.
    """

    session = SessionLocal()

    good_id = f"TEST-GOOD-{uuid.uuid4()}"
    bad_id = f"TEST-BAD-{uuid.uuid4()}"

    good = Asteroid(name="Good Access", nasa_jpl_id=good_id)
    bad = Asteroid(name="Bad Access", nasa_jpl_id=bad_id)

    session.add(good)
    session.add(bad)
    session.commit()

    good_orbit = AsteroidOrbit(
        asteroid_id=good.id,
        epoch_mjd=60200.5,
        semi_major_axis_au=1.0,
        eccentricity=0.05,
        inclination_deg=2.0,
        longitude_of_ascending_node_deg=100.0,
        argument_of_periapsis_deg=50.0,
        mean_anomaly_deg=20.0,
        orbital_period_days=365.0,
    )

    bad_orbit = AsteroidOrbit(
        asteroid_id=bad.id,
        epoch_mjd=60200.5,
        semi_major_axis_au=2.5,
        eccentricity=0.4,
        inclination_deg=30.0,
        longitude_of_ascending_node_deg=120.0,
        argument_of_periapsis_deg=40.0,
        mean_anomaly_deg=15.0,
        orbital_period_days=900.0,
    )

    session.add(good_orbit)
    session.add(bad_orbit)
    session.commit()

    results = list_most_accessible_asteroids(
        session,
        limit=2,
        nasa_jpl_ids=[good_id, bad_id],
    )
    ids = [row["nasa_jpl_id"] for row in results]

    assert ids[0] == good_id
    assert bad_id in ids

    session.query(AsteroidOrbit).filter(AsteroidOrbit.asteroid_id.in_([good.id, bad.id])).delete(
        synchronize_session=False
    )
    session.query(Asteroid).filter(Asteroid.nasa_jpl_id.in_([good_id, bad_id])).delete(
        synchronize_session=False
    )
    session.commit()
    session.close()
