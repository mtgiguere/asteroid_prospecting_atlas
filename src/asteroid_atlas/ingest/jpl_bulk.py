"""
jpl_bulk.py
"""

import logging
import time

import requests

from asteroid_atlas.ingest.jpl_asteroids import insert_asteroid, insert_asteroid_orbit
from asteroid_atlas.ingest.models import NormalizedAsteroid, NormalizedAsteroidOrbit
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit

logger = logging.getLogger(__name__)

_BULK_FIELDS = [
    "spkid",
    "full_name",
    "H",
    "diameter",
    "albedo",
    "e",
    "a",
    "i",
    "om",
    "w",
    "ma",
    "per",
    "epoch",
]

_ORBITAL_KEYS = {"e", "a", "i", "om", "w", "ma", "per", "epoch"}


def fetch_jpl_neo_bulk(limit: int = 500) -> dict:
    max_attempts = 3
    delay = 1

    for attempt in range(max_attempts):
        try:
            response = requests.get(
                "https://ssd-api.jpl.nasa.gov/sbdb_query.api",
                params={
                    "fields": ",".join(_BULK_FIELDS),
                    "sb-group": "neo",
                    "sb-kind": "a",
                    "limit": limit,
                },
                timeout=60,
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException:
            if attempt == max_attempts - 1:
                raise

            logger.warning("Bulk fetch failed, retrying...")
            time.sleep(delay)
            delay *= 2


def normalize_bulk_row(
    fields: list[str], row: list
) -> tuple[NormalizedAsteroid, NormalizedAsteroidOrbit | None]:
    lookup = dict(zip(fields, row, strict=True))

    spkid = lookup.get("spkid")
    full_name = lookup.get("full_name")

    if not spkid or not full_name:
        raise ValueError(f"Missing required fields spkid or full_name: {lookup}")

    def safe_float(key):
        v = lookup.get(key)
        return float(v) if v is not None else None

    asteroid = NormalizedAsteroid(
        name=full_name,
        nasa_jpl_id=str(spkid),
        absolute_magnitude_h=safe_float("H"),
        estimated_diameter_km=safe_float("diameter"),
        albedo=safe_float("albedo"),
    )

    orbit = None
    if all(lookup.get(k) is not None for k in _ORBITAL_KEYS):
        orbit = NormalizedAsteroidOrbit(
            epoch_mjd=float(lookup["epoch"]),
            semi_major_axis_au=float(lookup["a"]),
            eccentricity=float(lookup["e"]),
            inclination_deg=float(lookup["i"]),
            longitude_of_ascending_node_deg=float(lookup["om"]),
            argument_of_periapsis_deg=float(lookup["w"]),
            mean_anomaly_deg=float(lookup["ma"]),
            orbital_period_days=float(lookup["per"]),
        )

    return asteroid, orbit


def ingest_bulk_asteroids(session, limit: int = 500) -> list[Asteroid]:
    logger.info("Starting bulk NEO ingest, limit=%d", limit)

    payload = fetch_jpl_neo_bulk(limit)
    fields = payload["fields"]
    rows = payload["data"]

    results = []
    for row in rows:
        try:
            asteroid_data, orbit_data = normalize_bulk_row(fields, row)
            db_asteroid = insert_asteroid(session, asteroid_data)

            if orbit_data is not None:
                existing_orbit = (
                    session.query(AsteroidOrbit).filter_by(asteroid_id=db_asteroid.id).first()
                )
                if not existing_orbit:
                    insert_asteroid_orbit(session, db_asteroid.id, orbit_data)

            results.append(db_asteroid)

        except (ValueError, KeyError) as exc:
            logger.warning("Skipping malformed row: %s", exc)

    logger.info("Bulk ingest complete: %d asteroids processed", len(results))
    return results
