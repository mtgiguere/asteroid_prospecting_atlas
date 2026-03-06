"""
test_jpl_asteroids.py
"""

import uuid

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.ingest.jpl_asteroids import insert_asteroid
from asteroid_atlas.ingest.models import NormalizedAsteroid
from asteroid_atlas.models.asteroid import Asteroid


def test_insert_single_asteroid():
    """
    Verify ingestion loader inserts a normalized asteroid record.
    """

    session = SessionLocal()

    unique_id = f"TEST-{uuid.uuid4()}"

    asteroid_data = NormalizedAsteroid(
        name="Test Asteroid",
        nasa_jpl_id=unique_id,
    )

    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()

    insert_asteroid(session, asteroid_data)

    result = session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).first()

    assert result is not None
    assert result.name == "Test Asteroid"
    assert result.nasa_jpl_id == unique_id

    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()
    session.close()