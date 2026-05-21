"""
load_seed_asteroids.py
"""

from asteroid_atlas.ingest.jpl_bulk import ingest_bulk_asteroids
from asteroid_atlas.models.asteroid import Asteroid


def load_seed_asteroids(session, limit: int = 500) -> list[Asteroid]:
    return ingest_bulk_asteroids(session, limit)
