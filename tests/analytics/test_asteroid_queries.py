"""
test_asteroid_queries.py
"""

import uuid

from asteroid_atlas.analytics.asteroid_queries import list_asteroids_with_orbits
from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def test_list_asteroids_with_orbits_returns_joined_rows():
    """
    Ensure asteroid query returns joined asteroid and orbit data.
    """

    session = SessionLocal()
    unique_id = f"TEST-{uuid.uuid4()}"

    asteroid = Asteroid(
        name="Query Test Asteroid",
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

    results = list_asteroids_with_orbits(session)

    match = next((row for row in results if row["nasa_jpl_id"] == unique_id), None)

    assert match is not None
    assert match["name"] == "Query Test Asteroid"
    assert match["epoch_mjd"] == 60200.5
    assert match["semi_major_axis_au"] == 1.458
    assert match["eccentricity"] == 0.223

    session.query(AsteroidOrbit).filter_by(asteroid_id=asteroid.id).delete()
    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()
    session.close()