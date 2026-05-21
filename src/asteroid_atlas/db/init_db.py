"""
init_db.py
"""

from sqlalchemy import text

import asteroid_atlas.models.asteroid  # noqa: F401
import asteroid_atlas.models.asteroid_orbit  # noqa: F401
from asteroid_atlas.db.session import engine
from asteroid_atlas.models.base import Base


def main() -> None:
    """Create database tables."""
    Base.metadata.create_all(bind=engine)
    _apply_migrations()


def _apply_migrations() -> None:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE asteroids ADD COLUMN IF NOT EXISTS spectral_type TEXT"))
        conn.commit()


if __name__ == "__main__":  # pragma: no cover
    main()
