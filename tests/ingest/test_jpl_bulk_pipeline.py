"""
test_jpl_bulk_pipeline.py
"""

from unittest.mock import patch

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.ingest.jpl_bulk import ingest_bulk_asteroids
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit

FIELDS = [
    "spkid",
    "full_name",
    "H",
    "diameter",
    "albedo",
    "e",
    "a",
    "i",
    "om",
    "w",
    "ma",
    "per",
    "epoch",
]

MOCK_PAYLOAD = {
    "fields": FIELDS,
    "data": [
        [
            "BLKP-1",
            "Bulk Pipeline 1",
            "10.0",
            "5.0",
            "0.2",
            "0.15",
            "1.3",
            "8.0",
            "200.0",
            "90.0",
            "45.0",
            "550.0",
            "60200.5",
        ],
        [
            "BLKP-2",
            "Bulk Pipeline 2",
            "12.0",
            None,
            None,
            "0.08",
            "2.1",
            "3.5",
            "110.0",
            "60.0",
            "90.0",
            "1100.0",
            "60201.0",
        ],
        [
            "BLKP-3",
            "Bulk Pipeline 3 (no orbit)",
            "14.0",
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        ],
    ],
    "count": 3,
}


def _cleanup(session, spkids):
    existing = session.query(Asteroid).filter(Asteroid.nasa_jpl_id.in_(spkids)).all()
    ids = [a.id for a in existing]
    if ids:
        session.query(AsteroidOrbit).filter(AsteroidOrbit.asteroid_id.in_(ids)).delete(
            synchronize_session=False
        )
    session.query(Asteroid).filter(Asteroid.nasa_jpl_id.in_(spkids)).delete(
        synchronize_session=False
    )
    session.commit()


TEST_SPKIDS = ["BLKP-1", "BLKP-2", "BLKP-3"]


def test_ingest_bulk_asteroids_inserts_all_rows():
    session = SessionLocal()
    _cleanup(session, TEST_SPKIDS)

    with patch("asteroid_atlas.ingest.jpl_bulk.fetch_jpl_neo_bulk", return_value=MOCK_PAYLOAD):
        results = ingest_bulk_asteroids(session, limit=3)

    assert len(results) == 3
    names = {r.name for r in results}
    assert "Bulk Pipeline 1" in names
    assert "Bulk Pipeline 2" in names
    assert "Bulk Pipeline 3 (no orbit)" in names

    _cleanup(session, TEST_SPKIDS)
    session.close()


def test_ingest_bulk_asteroids_only_inserts_orbit_when_complete():
    session = SessionLocal()
    _cleanup(session, TEST_SPKIDS)

    with patch("asteroid_atlas.ingest.jpl_bulk.fetch_jpl_neo_bulk", return_value=MOCK_PAYLOAD):
        ingest_bulk_asteroids(session, limit=3)

    with_orbit = session.query(Asteroid).filter_by(nasa_jpl_id="BLKP-1").first()
    no_orbit = session.query(Asteroid).filter_by(nasa_jpl_id="BLKP-3").first()

    assert session.query(AsteroidOrbit).filter_by(asteroid_id=with_orbit.id).first() is not None
    assert session.query(AsteroidOrbit).filter_by(asteroid_id=no_orbit.id).first() is None

    _cleanup(session, TEST_SPKIDS)
    session.close()


def test_ingest_bulk_asteroids_is_idempotent():
    session = SessionLocal()
    _cleanup(session, TEST_SPKIDS)

    with patch("asteroid_atlas.ingest.jpl_bulk.fetch_jpl_neo_bulk", return_value=MOCK_PAYLOAD):
        ingest_bulk_asteroids(session, limit=3)
        ingest_bulk_asteroids(session, limit=3)

    count = session.query(Asteroid).filter(Asteroid.nasa_jpl_id.in_(TEST_SPKIDS)).count()
    assert count == 3

    existing = session.query(Asteroid).filter(Asteroid.nasa_jpl_id.in_(TEST_SPKIDS)).all()
    for asteroid in existing:
        orbit_count = session.query(AsteroidOrbit).filter_by(asteroid_id=asteroid.id).count()
        assert orbit_count <= 1

    _cleanup(session, TEST_SPKIDS)
    session.close()


def test_ingest_bulk_asteroids_skips_malformed_rows():
    session = SessionLocal()
    bad_spkids = ["BLKP-GOOD", "BLKP-BAD"]
    _cleanup(session, bad_spkids)

    payload = {
        "fields": FIELDS,
        "data": [
            [
                "BLKP-GOOD",
                "Good Row",
                "10.0",
                None,
                None,
                "0.1",
                "1.5",
                "5.0",
                "100.0",
                "50.0",
                "180.0",
                "600.0",
                "60200.5",
            ],
            [None, None, None, None, None, None, None, None, None, None, None, None, None],
        ],
        "count": 2,
    }

    with patch("asteroid_atlas.ingest.jpl_bulk.fetch_jpl_neo_bulk", return_value=payload):
        results = ingest_bulk_asteroids(session, limit=2)

    assert len(results) == 1
    assert results[0].name == "Good Row"

    _cleanup(session, bad_spkids)
    session.close()
