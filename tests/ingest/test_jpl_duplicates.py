"""
test_jpl_duplicates.py
"""

import uuid

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.ingest.jpl_asteroids import insert_asteroid
from asteroid_atlas.ingest.models import NormalizedAsteroid
from asteroid_atlas.models.asteroid import Asteroid


def test_insert_asteroid_updates_spectral_type_on_existing_record():
    """
    If an existing asteroid has spectral_type=None and the incoming record
    carries a spectral_type, insert_asteroid should patch it.
    """

    session = SessionLocal()
    unique_id = f"TEST-SPEC-{uuid.uuid4()}"

    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()

    without_type = NormalizedAsteroid(name="Spec Test", nasa_jpl_id=unique_id, spectral_type=None)
    insert_asteroid(session, without_type)

    with_type = NormalizedAsteroid(name="Spec Test", nasa_jpl_id=unique_id, spectral_type="S")
    insert_asteroid(session, with_type)

    updated = session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).first()

    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()
    session.close()

    assert updated.spectral_type == "S"


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
