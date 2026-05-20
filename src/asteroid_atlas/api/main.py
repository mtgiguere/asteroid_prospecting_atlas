"""
main.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from asteroid_atlas.analytics.asteroid_queries import (
    list_asteroids_for_visualization,
    list_most_accessible_asteroids,
    list_most_prospectable_asteroids,
)
from asteroid_atlas.db.session import SessionLocal

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/ping")
def ping() -> dict[str, str]:
    return {"message": "pong"}


@app.get("/asteroids/orbits")
def get_asteroid_orbits(limit: int = 200, earth_crossing_only: bool = False):
    """
    Full orbital elements + prospecting and accessibility scores for 3D visualization.
    """

    session = SessionLocal()

    try:
        return list_asteroids_for_visualization(
            session,
            limit=limit,
            earth_crossing_only=earth_crossing_only,
        )
    finally:
        session.close()


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


@app.get("/asteroids/prospectable")
def get_prospectable_asteroids(limit: int = 10, earth_crossing_only: bool = False):
    """
    Return the most promising asteroid prospecting targets.
    """

    session = SessionLocal()

    try:
        results = list_most_prospectable_asteroids(
            session,
            limit=limit,
            earth_crossing_only=earth_crossing_only,
        )
        return results
    finally:
        session.close()
