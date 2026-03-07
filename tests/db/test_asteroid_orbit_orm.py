"""
test_asteroid_orbit_orm.py
"""

import uuid

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def test_asteroid_orbit_can_be_inserted_and_queried():
    """
    Ensure an asteroid orbit row can be inserted and queried.
    """

    session = SessionLocal()
    unique_id = f"TEST-{uuid.uuid4()}"

    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()

    asteroid = Asteroid(name="Orbit Test", nasa_jpl_id=unique_id)
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

    result = session.query(AsteroidOrbit).filter_by(asteroid_id=asteroid.id).first()

    assert result is not None
    assert result.epoch_mjd == 60200.5
    assert result.semi_major_axis_au == 1.458

    session.query(AsteroidOrbit).filter_by(asteroid_id=asteroid.id).delete()
    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()
    session.close()
