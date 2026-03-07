"""
test_asteroid_model.py
"""

from sqlalchemy import text

from asteroid_atlas.db.session import SessionLocal


def test_insert_asteroid_record() -> None:
    """Ensure we can insert and retrieve an asteroid record."""

    session = SessionLocal()

    try:
        session.execute(
            text(
                """
                DELETE FROM asteroids
                WHERE nasa_jpl_id = 'TEST-001'
                """
            )
        )
        session.commit()

        session.execute(
            text(
                """
                INSERT INTO asteroids (name, nasa_jpl_id)
                VALUES ('Test Asteroid', 'TEST-001')
                """
            )
        )
        session.commit()

        result = session.execute(
            text(
                """
                SELECT name FROM asteroids
                WHERE nasa_jpl_id = 'TEST-001'
                """
            )
        ).scalar()

        assert result == "Test Asteroid"

    finally:
        session.execute(
            text(
                """
                DELETE FROM asteroids
                WHERE nasa_jpl_id = 'TEST-001'
                """
            )
        )
        session.commit()
        session.close()
