"""
asteroid_queries.py

Read/query helpers for asteroid analytics.
"""

from asteroid_atlas.analytics.orbital_metrics import calculate_perihelion_aphelion
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit
from asteroid_atlas.analytics.orbital_classification import is_earth_orbit_crossing


def list_asteroids_with_orbits(session) -> list[dict]:
    """
    Return joined asteroid and orbit records as dictionaries.
    """

    rows = (
        session.query(Asteroid, AsteroidOrbit)
        .join(AsteroidOrbit, Asteroid.id == AsteroidOrbit.asteroid_id)
        .all()
    )

    results = []

    for asteroid, orbit in rows:
        results.append(
            {
                "asteroid_id": asteroid.id,
                "name": asteroid.name,
                "nasa_jpl_id": asteroid.nasa_jpl_id,
                "orbit_id": orbit.id,
                "epoch_mjd": orbit.epoch_mjd,
                "semi_major_axis_au": orbit.semi_major_axis_au,
                "eccentricity": orbit.eccentricity,
                "inclination_deg": orbit.inclination_deg,
                "longitude_of_ascending_node_deg": orbit.longitude_of_ascending_node_deg,
                "argument_of_periapsis_deg": orbit.argument_of_periapsis_deg,
                "mean_anomaly_deg": orbit.mean_anomaly_deg,
                "orbital_period_days": orbit.orbital_period_days,
            }
        )

    return results

def list_asteroids_with_orbital_metrics(session) -> list[dict]:
    """
    Return asteroid records with derived orbital metrics.
    """

    rows = (
        session.query(Asteroid, AsteroidOrbit)
        .join(AsteroidOrbit, Asteroid.id == AsteroidOrbit.asteroid_id)
        .all()
    )

    results = []

    for asteroid, orbit in rows:
        perihelion, aphelion = calculate_perihelion_aphelion(
            orbit.semi_major_axis_au,
            orbit.eccentricity,
        )

        earth_crossing = is_earth_orbit_crossing(perihelion, aphelion)

        results.append(
            {
                "asteroid_id": asteroid.id,
                "name": asteroid.name,
                "nasa_jpl_id": asteroid.nasa_jpl_id,
                "semi_major_axis_au": orbit.semi_major_axis_au,
                "eccentricity": orbit.eccentricity,
                "perihelion_au": perihelion,
                "aphelion_au": aphelion,
                "earth_orbit_crossing": earth_crossing,
            }
        )

    return results

def list_earth_crossing_asteroids(session) -> list[dict]:
    rows = list_asteroids_with_orbital_metrics(session)
    return [row for row in rows if row["earth_orbit_crossing"]]