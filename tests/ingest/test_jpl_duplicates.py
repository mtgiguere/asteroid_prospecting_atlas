"""
test_jpl_duplicates.py
"""

import uuid

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.ingest.jpl_asteroids import insert_asteroid
from asteroid_atlas.ingest.models import NormalizedAsteroid
from asteroid_atlas.models.asteroid import Asteroid


def test_insert_asteroid_returns_existing_if_duplicate():
    """
    Ensure inserting the same asteroid twice returns the existing row.
    """

    session = SessionLocal()

    unique_id = f"TEST-{uuid.uuid4()}"

    asteroid = NormalizedAsteroid(
        name="Duplicate Asteroid",
        nasa_jpl_id=unique_id,
    )

    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()

    first = insert_asteroid(session, asteroid)
    second = insert_asteroid(session, asteroid)

    assert first.id == second.id
    assert first.nasa_jpl_id == second.nasa_jpl_id

    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()
    session.close()
