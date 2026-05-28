"""
session.py
"""

import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


def _normalise_db_url(url: str) -> str:
    # Rewrite any postgres dialect to the psycopg3 driver installed in this project.
    # Handles: postgresql://, postgres://, postgresql+psycopg2://
    if url.startswith("postgresql+psycopg2://"):
        return url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    return url


DATABASE_URL = _normalise_db_url(
    os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://atlas:atlas_dev_password@localhost:5432/asteroid_atlas",
    )
)

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def test_connection() -> int:
    """Run a trivial connectivity query."""
    with engine.connect() as connection:
        return connection.execute(text("SELECT 1")).scalar_one()
