"""
main.py
"""

from fastapi import FastAPI

from asteroid_atlas.analytics.asteroid_queries import list_most_accessible_asteroids
from asteroid_atlas.db.session import SessionLocal

app = FastAPI()

@app.get("/ping")
def ping() -> dict[str, str]:
    return {"message": "pong"}


@app.get("/asteroids/accessible")
def get_accessible_asteroids(limit: int = 10, earth_crossing_only: bool = False):
    """
    Return the most accessible asteroids based on orbital similarity to Earth.
    """

    session = SessionLocal()

    try:
        results = list_most_accessible_asteroids(
            session,
            limit=limit,
            earth_crossing_only=earth_crossing_only,
        )
        return results
    finally:
        session.close()