"""
test_jpl_batch_ingestion.py
"""

from unittest.mock import patch

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.ingest.jpl_asteroids import ingest_asteroids
from asteroid_atlas.models.asteroid import Asteroid


def test_ingest_asteroids_batch():
    """
    Ensure multiple asteroids can be ingested in a batch.
    """

    session = SessionLocal()

    spkids = ["TEST-BATCH-1", "TEST-BATCH-2"]

    mock_payloads = {
        "TEST-BATCH-1": {
            "object": {"fullname": "Batch Asteroid 1", "spkid": "TEST-BATCH-1"}
        },
        "TEST-BATCH-2": {
            "object": {"fullname": "Batch Asteroid 2", "spkid": "TEST-BATCH-2"}
        },
    }

    session.query(Asteroid).filter(
        Asteroid.nasa_jpl_id.in_(spkids)
    ).delete(synchronize_session=False)
    session.commit()

    def fake_fetch(spkid):
        return mock_payloads[spkid]

    with patch(
        "asteroid_atlas.ingest.jpl_asteroids.fetch_jpl_asteroid",
        side_effect=fake_fetch,
    ):
        results = ingest_asteroids(session, spkids)

    assert len(results) == 2

    names = {r.name for r in results}
    assert "Batch Asteroid 1" in names
    assert "Batch Asteroid 2" in names

    session.query(Asteroid).filter(
        Asteroid.nasa_jpl_id.in_(spkids)
    ).delete(synchronize_session=False)
    session.commit()

    session.close()