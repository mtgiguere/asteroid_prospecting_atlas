"""
test_jpl_full_pipeline.py
"""

import uuid
from unittest.mock import patch

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.ingest.jpl_asteroids import ingest_asteroid_with_orbit
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def test_ingest_asteroid_with_orbit():
    """
    Ensure a single asteroid and its orbit can be ingested end to end.
    """

    session = SessionLocal()
    unique_id = f"TEST-{uuid.uuid4()}"

    mock_payload = {
        "object": {
            "fullname": "Full Pipeline Asteroid",
            "spkid": unique_id,
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
    }

    session.query(AsteroidOrbit).filter(
        AsteroidOrbit.asteroid_id.in_(session.query(Asteroid.id).filter_by(nasa_jpl_id=unique_id))
    ).delete(synchronize_session=False)
    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()

    with patch(
        "asteroid_atlas.ingest.jpl_asteroids.fetch_jpl_asteroid",
        return_value=mock_payload,
    ) as mock_fetch:
        result = ingest_asteroid_with_orbit(session, unique_id)

    mock_fetch.assert_called_once_with(unique_id)

    assert result is not None
    assert result.name == "Full Pipeline Asteroid"
    assert result.nasa_jpl_id == unique_id

    db_asteroid = session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).first()
    assert db_asteroid is not None

    db_orbit = session.query(AsteroidOrbit).filter_by(asteroid_id=db_asteroid.id).first()
    assert db_orbit is not None
    assert db_orbit.epoch_mjd == 60200.5
    assert db_orbit.semi_major_axis_au == 1.458

    session.query(AsteroidOrbit).filter_by(asteroid_id=db_asteroid.id).delete()
    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()
    session.close()


def test_ingest_asteroid_with_orbit_persists_physical_properties():
    """
    Ensure physical asteroid properties are persisted through the full pipeline.
    """

    session = SessionLocal()
    unique_id = f"TEST-{uuid.uuid4()}"

    mock_payload = {
        "object": {
            "fullname": "Physical Pipeline Asteroid",
            "spkid": unique_id,
        },
        "phys_par": {
            "H": "10.31",
            "diameter": "16.84",
            "albedo": "0.25",
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
    }

    session.query(AsteroidOrbit).filter(
        AsteroidOrbit.asteroid_id.in_(session.query(Asteroid.id).filter_by(nasa_jpl_id=unique_id))
    ).delete(synchronize_session=False)
    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()

    with patch(
        "asteroid_atlas.ingest.jpl_asteroids.fetch_jpl_asteroid",
        return_value=mock_payload,
    ) as mock_fetch:
        result = ingest_asteroid_with_orbit(session, unique_id)

    mock_fetch.assert_called_once_with(unique_id)

    assert result is not None
    assert result.name == "Physical Pipeline Asteroid"
    assert result.nasa_jpl_id == unique_id

    db_asteroid = session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).first()
    assert db_asteroid is not None
    assert db_asteroid.absolute_magnitude_h == 10.31
    assert db_asteroid.estimated_diameter_km == 16.84
    assert db_asteroid.albedo == 0.25

    db_orbit = session.query(AsteroidOrbit).filter_by(asteroid_id=db_asteroid.id).first()
    assert db_orbit is not None
    assert db_orbit.epoch_mjd == 60200.5
    assert db_orbit.semi_major_axis_au == 1.458

    session.query(AsteroidOrbit).filter_by(asteroid_id=db_asteroid.id).delete()
    session.query(Asteroid).filter_by(nasa_jpl_id=unique_id).delete()
    session.commit()
    session.close()
