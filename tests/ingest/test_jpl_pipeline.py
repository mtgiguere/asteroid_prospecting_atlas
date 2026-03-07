"""
test_jpl_pipeline.py
"""

import uuid
from unittest.mock import patch

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.ingest.jpl_asteroids import ingest_asteroid
from asteroid_atlas.models.asteroid import Asteroid


def test_ingest_asteroid_fetches_normalizes_and_inserts():
    """
    Ensure a single asteroid can be fetched, normalized, and inserted end to end.
    """

    session = SessionLocal()
    unique_id = f"TEST-{uuid.uuid4()}"

    mock_payload = {
        "object": {
            "fullname": "Pipeline Asteroid",
            "spkid": unique_id,
        }
    }

    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()

    with patch(
        "asteroid_atlas.ingest.jpl_asteroids.fetch_jpl_asteroid",
        return_value=mock_payload,
    ) as mock_fetch:
        result = ingest_asteroid(session, unique_id)

    mock_fetch.assert_called_once_with(unique_id)
    assert result.name == "Pipeline Asteroid"
    assert result.nasa_jpl_id == unique_id

    db_result = session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).first()
    assert db_result is not None
    assert db_result.name == "Pipeline Asteroid"

    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()
    session.close()
