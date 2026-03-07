"""
test_jpl_full_batch_pipeline.py
"""

from unittest.mock import patch

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.ingest.jpl_asteroids import ingest_asteroids_with_orbits
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def test_ingest_asteroids_with_orbits():
    """
    Ensure multiple asteroids and their orbits can be ingested end to end.
    """

    session = SessionLocal()
    spkids = ["TEST-FULL-BATCH-1", "TEST-FULL-BATCH-2"]

    mock_payloads = {
        "TEST-FULL-BATCH-1": {
            "object": {
                "fullname": "Full Batch Asteroid 1",
                "spkid": "TEST-FULL-BATCH-1",
            },
            "orbit": {
                "epoch": "60200.5",
                "elements": {
                    "a": "1.458",
                    "e": "0.223",
                    "i": "10.83",
                    "om": "304.4",
                    "w": "178.7",
                    "ma": "42.1",
                    "per": "643.2",
                },
            },
        },
        "TEST-FULL-BATCH-2": {
            "object": {
                "fullname": "Full Batch Asteroid 2",
                "spkid": "TEST-FULL-BATCH-2",
            },
            "orbit": {
                "epoch": "60201.5",
                "elements": {
                    "a": "2.100",
                    "e": "0.111",
                    "i": "5.25",
                    "om": "120.0",
                    "w": "88.8",
                    "ma": "10.5",
                    "per": "900.1",
                },
            },
        },
    }

    existing_asteroids = session.query(Asteroid).filter(Asteroid.nasa_jpl_id.in_(spkids)).all()
    existing_ids = [a.id for a in existing_asteroids]

    if existing_ids:
        session.query(AsteroidOrbit).filter(AsteroidOrbit.asteroid_id.in_(existing_ids)).delete(
            synchronize_session=False
        )

    session.query(Asteroid).filter(Asteroid.nasa_jpl_id.in_(spkids)).delete(
        synchronize_session=False
    )
    session.commit()

    def fake_fetch(spkid):
        return mock_payloads[spkid]

    with patch(
        "asteroid_atlas.ingest.jpl_asteroids.fetch_jpl_asteroid",
        side_effect=fake_fetch,
    ):
        results = ingest_asteroids_with_orbits(session, spkids)

    assert len(results) == 2

    names = {r.name for r in results}
    assert "Full Batch Asteroid 1" in names
    assert "Full Batch Asteroid 2" in names

    db_asteroids = session.query(Asteroid).filter(Asteroid.nasa_jpl_id.in_(spkids)).all()
    assert len(db_asteroids) == 2

    asteroid_ids = [a.id for a in db_asteroids]
    db_orbits = (
        session.query(AsteroidOrbit).filter(AsteroidOrbit.asteroid_id.in_(asteroid_ids)).all()
    )
    assert len(db_orbits) == 2

    session.query(AsteroidOrbit).filter(AsteroidOrbit.asteroid_id.in_(asteroid_ids)).delete(
        synchronize_session=False
    )
    session.query(Asteroid).filter(Asteroid.nasa_jpl_id.in_(spkids)).delete(
        synchronize_session=False
    )
    session.commit()
    session.close()
