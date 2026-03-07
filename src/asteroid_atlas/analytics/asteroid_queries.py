"""
asteroid_queries.py

Read/query helpers for asteroid analytics.
"""

from asteroid_atlas.analytics.accessibility import calculate_accessibility_score
from asteroid_atlas.analytics.orbital_classification import is_earth_orbit_crossing
from asteroid_atlas.analytics.orbital_metrics import calculate_perihelion_aphelion
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


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
                "inclination_deg": orbit.inclination_deg,
                "perihelion_au": perihelion,
                "aphelion_au": aphelion,
                "earth_orbit_crossing": earth_crossing,
            }
        )

    return results


def list_earth_crossing_asteroids(session) -> list[dict]:
    rows = list_asteroids_with_orbital_metrics(session)
    return [row for row in rows if row["earth_orbit_crossing"]]


def list_most_accessible_asteroids(
    session,
    limit: int = 10,
    nasa_jpl_ids: list[str] | None = None,
    earth_crossing_only: bool = False,
) -> list[dict]:
    """
    Return asteroids ordered by accessibility score, lowest first.
    Optionally restrict results to a provided set of JPL IDs.
    """
    rows = list_asteroids_with_orbital_metrics(session)

    if nasa_jpl_ids is not None:
        allowed = set(nasa_jpl_ids)
        rows = [r for r in rows if r["nasa_jpl_id"] in allowed]

    if earth_crossing_only:
        rows = [r for r in rows if r["earth_orbit_crossing"]]

    for row in rows:
        row["accessibility_score"] = calculate_accessibility_score(
            row["semi_major_axis_au"],
            row["eccentricity"],
            row["inclination_deg"],
        )

    rows.sort(key=lambda r: r["accessibility_score"])

    return rows[:limit]
