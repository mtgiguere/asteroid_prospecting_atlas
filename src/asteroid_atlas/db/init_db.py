"""
init_db.py
"""

from asteroid_atlas.db.session import engine
from asteroid_atlas.models.base import Base

import asteroid_atlas.models.asteroid  # noqa: F401
import asteroid_atlas.models.asteroid_orbit  # noqa: F401


def main() -> None:
    """Create database tables."""
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    main()
