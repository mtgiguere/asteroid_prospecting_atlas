"""
test_session.py
"""

from sqlalchemy import text

from asteroid_atlas.db.session import SessionLocal


def test_db_session_can_connect() -> None:
    """Ensure we can create a DB session and run a trivial query."""

    session = SessionLocal()

    result = session.execute(text("SELECT 1")).scalar()

    assert result == 1
