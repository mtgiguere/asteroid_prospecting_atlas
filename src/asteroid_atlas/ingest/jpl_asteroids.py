"""
jpl_asteroids.py
"""

import logging
import time

import requests

from asteroid_atlas.ingest.models import NormalizedAsteroid, NormalizedAsteroidOrbit
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit

logger = logging.getLogger(__name__)


def fetch_jpl_asteroid(spkid: str) -> dict:
    """
    Fetch a single asteroid record from the JPL Small Body Database API.
    """

    logger.info("Fetching asteroid %s from JPL API", spkid)

    max_attempts = 3
    delay = 1

    for attempt in range(max_attempts):
        try:
            response = requests.get(
                "https://ssd-api.jpl.nasa.gov/sbdb.api",
                params={"sstr": spkid},
                timeout=30,
            )

            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException:
            if attempt == max_attempts - 1:
                raise

            logger.warning("Fetch failed for %s, retrying...", spkid)
            time.sleep(delay)
            delay *= 2


def normalize_jpl_asteroid(jpl_json: dict) -> NormalizedAsteroid:
    """
    Convert JPL JSON structure into a normalized asteroid model.
    """

    obj = jpl_json.get("object")
    if obj is None:
        raise ValueError("Missing 'object' in JPL payload")

    fullname = obj.get("fullname")
    if not fullname:
        raise ValueError("Missing required field 'fullname'")

    spkid = obj.get("spkid")
    if not spkid:
        raise ValueError("Missing required field 'spkid'")

    logger.debug("Normalized asteroid %s", spkid)

    return NormalizedAsteroid(
        name=fullname,
        nasa_jpl_id=spkid,
    )


def insert_asteroid(session, asteroid: NormalizedAsteroid) -> Asteroid:
    """
    Insert a normalized asteroid record into the database.
    """

    existing = session.query(Asteroid).filter_by(nasa_jpl_id=asteroid.nasa_jpl_id).first()

    if existing:
        logger.info("Asteroid %s already exists", asteroid.nasa_jpl_id)
        return existing

    db_asteroid = Asteroid(
        name=asteroid.name,
        nasa_jpl_id=asteroid.nasa_jpl_id,
    )

    session.add(db_asteroid)
    session.commit()

    logger.info("Inserted asteroid %s", asteroid.nasa_jpl_id)

    return db_asteroid


def ingest_asteroid(session, spkid: str) -> Asteroid:
    """
    Fetch, normalize, and insert a single asteroid record.
    """

    jpl_json = fetch_jpl_asteroid(spkid)
    asteroid = normalize_jpl_asteroid(jpl_json)
    return insert_asteroid(session, asteroid)


def ingest_asteroids(session, spkids: list[str]) -> list[Asteroid]:
    """
    Ingest multiple asteroids by their JPL SPKIDs.
    """

    results = []

    for spkid in spkids:
        asteroid = ingest_asteroid(session, spkid)
        results.append(asteroid)

    return results


def normalize_jpl_orbit(jpl_json: dict) -> NormalizedAsteroidOrbit:
    """
    Convert JPL JSON orbit structure into a normalized orbit model.
    """

    orbit = jpl_json.get("orbit")
    if orbit is None:
        raise ValueError("Missing 'orbit' in JPL payload")

    elements = orbit.get("elements")
    if elements is None:
        raise ValueError("Missing 'elements' in JPL orbit payload")

    if isinstance(elements, list):
        element_lookup = {
            item["name"]: item["value"] for item in elements if "name" in item and "value" in item
        }
    else:
        element_lookup = elements

    return NormalizedAsteroidOrbit(
        epoch_mjd=float(orbit["epoch"]),
        semi_major_axis_au=float(element_lookup["a"]),
        eccentricity=float(element_lookup["e"]),
        inclination_deg=float(element_lookup["i"]),
        longitude_of_ascending_node_deg=float(element_lookup["om"]),
        argument_of_periapsis_deg=float(element_lookup["w"]),
        mean_anomaly_deg=float(element_lookup["ma"]),
        orbital_period_days=float(element_lookup["per"]),
    )


def insert_asteroid_orbit(
    session, asteroid_id: int, orbit: NormalizedAsteroidOrbit
) -> AsteroidOrbit:
    """
    Insert an asteroid orbit record into the database.
    """

    db_orbit = AsteroidOrbit(
        asteroid_id=asteroid_id,
        epoch_mjd=orbit.epoch_mjd,
        semi_major_axis_au=orbit.semi_major_axis_au,
        eccentricity=orbit.eccentricity,
        inclination_deg=orbit.inclination_deg,
        longitude_of_ascending_node_deg=orbit.longitude_of_ascending_node_deg,
        argument_of_periapsis_deg=orbit.argument_of_periapsis_deg,
        mean_anomaly_deg=orbit.mean_anomaly_deg,
        orbital_period_days=orbit.orbital_period_days,
    )

    session.add(db_orbit)
    session.commit()

    return db_orbit


def ingest_asteroid_with_orbit(session, spkid: str) -> Asteroid:
    """
    Fetch, normalize, and insert a single asteroid and its orbit.
    """

    jpl_json = fetch_jpl_asteroid(spkid)

    asteroid = normalize_jpl_asteroid(jpl_json)
    orbit = normalize_jpl_orbit(jpl_json)

    db_asteroid = insert_asteroid(session, asteroid)
    insert_asteroid_orbit(session, db_asteroid.id, orbit)

    return db_asteroid


def ingest_asteroids_with_orbits(session, spkids: list[str]) -> list[Asteroid]:
    """
    Ingest multiple asteroids and their orbits by JPL SPKID.
    """

    results = []

    for spkid in spkids:
        asteroid = ingest_asteroid_with_orbit(session, spkid)
        results.append(asteroid)

    return results
