"""
main.py
"""

import os
from datetime import date

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from asteroid_atlas.analytics.asteroid_queries import (
    list_asteroids_for_visualization,
    list_most_accessible_asteroids,
    list_most_prospectable_asteroids,
)
from asteroid_atlas.db.session import SessionLocal

_default_origins = "http://localhost:5173,http://localhost:3000"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/ping")
def ping() -> dict[str, str]:
    return {"message": "pong"}


def _today_mjd() -> float:
    return 51544.0 + (date.today() - date(2000, 1, 1)).days


@app.get("/asteroids/orbits")
def get_asteroid_orbits(
    limit: int = 200,
    earth_crossing_only: bool = False,
    current_mjd: float | None = None,
):
    """
    Full orbital elements + prospecting and accessibility scores for 3D visualization.
    """

    session = SessionLocal()

    try:
        return list_asteroids_for_visualization(
            session,
            limit=limit,
            earth_crossing_only=earth_crossing_only,
            current_mjd=current_mjd if current_mjd is not None else _today_mjd(),
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
