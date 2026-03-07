"""
test_jpl_orbit_insert.py
"""

import uuid

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.ingest.jpl_asteroids import insert_asteroid_orbit
from asteroid_atlas.ingest.models import NormalizedAsteroidOrbit
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def test_insert_asteroid_orbit():
    """
    Ensure an asteroid orbit can be inserted into the database.
    """

    session = SessionLocal()
    unique_id = f"TEST-{uuid.uuid4()}"

    # Create asteroid first
    asteroid = Asteroid(name="Orbit Insert Test", nasa_jpl_id=unique_id)
    session.add(asteroid)
    session.commit()

    orbit_data = NormalizedAsteroidOrbit(
        epoch_mjd=60200.5,
        semi_major_axis_au=1.458,
        eccentricity=0.223,
        inclination_deg=10.83,
        longitude_of_ascending_node_deg=304.4,
        argument_of_periapsis_deg=178.7,
        mean_anomaly_deg=42.1,
        orbital_period_days=643.2,
    )

    result = insert_asteroid_orbit(session, asteroid.id, orbit_data)

    assert result.asteroid_id == asteroid.id
    assert result.semi_major_axis_au == 1.458

    session.query(AsteroidOrbit).filter_by(asteroid_id=asteroid.id).delete()
    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()

    session.commit()
    session.close()
