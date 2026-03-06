"""
test_asteroid_orm.py
"""

from sqlalchemy import text

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.models.asteroid import Asteroid


def test_create_asteroid_object() -> None:
    """Ensure we can create an Asteroid ORM object and persist it."""

    session = SessionLocal()

    try:
        session.execute(
            text(
                """
                DELETE FROM asteroids
                WHERE nasa_jpl_id = 'ORM-001'
                """
            )
        )
        session.commit()

        asteroid = Asteroid(
            name="ORM Test Asteroid",
            nasa_jpl_id="ORM-001",
        )

        session.add(asteroid)
        session.commit()

        result = session.query(Asteroid).filter_by(nasa_jpl_id="ORM-001").first()

        assert result is not None
        assert result.name == "ORM Test Asteroid"

    finally:
        session.execute(
            text(
                """
                DELETE FROM asteroids
                WHERE nasa_jpl_id = 'ORM-001'
                """
            )
        )
        session.commit()
        session.close()