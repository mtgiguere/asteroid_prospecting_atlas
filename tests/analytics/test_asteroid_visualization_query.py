"""
test_asteroid_visualization_query.py
"""

import uuid

from asteroid_atlas.analytics.asteroid_queries import list_asteroids_for_visualization
from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def test_list_asteroids_for_visualization_returns_full_orbital_elements():
    """
    Ensure the visualization query returns longitude_of_ascending_node_deg
    and argument_of_periapsis_deg needed for 3D orbit rendering.
    """

    session = SessionLocal()
    jpl_id = f"TEST-VIZ-{uuid.uuid4()}"

    asteroid = Asteroid(name="Viz Test Asteroid", nasa_jpl_id=jpl_id, estimated_diameter_km=3.0)
    session.add(asteroid)
    session.commit()

    orbit = AsteroidOrbit(
        asteroid_id=asteroid.id,
        epoch_mjd=60200.5,
        semi_major_axis_au=1.5,
        eccentricity=0.15,
        inclination_deg=8.0,
        longitude_of_ascending_node_deg=120.0,
        argument_of_periapsis_deg=60.0,
        mean_anomaly_deg=30.0,
        orbital_period_days=670.0,
    )
    session.add(orbit)
    session.commit()

    results = list_asteroids_for_visualization(session, limit=500, nasa_jpl_ids=[jpl_id])

    # Cleanup — orbit first (FK dependency)
    session.delete(orbit)
    session.commit()
    session.delete(asteroid)
    session.commit()
    session.close()

    assert any(r["nasa_jpl_id"] == jpl_id for r in results)
    row = next(r for r in results if r["nasa_jpl_id"] == jpl_id)

    assert "longitude_of_ascending_node_deg" in row
    assert "argument_of_periapsis_deg" in row
    assert "prospecting_score" in row
    assert "accessibility_score" in row
    assert "perihelion_au" in row
    assert "aphelion_au" in row
    assert "earth_orbit_crossing" in row


def test_list_asteroids_for_visualization_earth_crossing_filter():
    """
    Earth-crossing filter should exclude non-crossing asteroids.
    """

    session = SessionLocal()
    crossing_id = f"TEST-VIZ-CROSS-{uuid.uuid4()}"
    non_crossing_id = f"TEST-VIZ-NONCROSS-{uuid.uuid4()}"

    crossing = Asteroid(name="VizCross", nasa_jpl_id=crossing_id)
    non_crossing = Asteroid(name="VizNonCross", nasa_jpl_id=non_crossing_id)
    session.add_all([crossing, non_crossing])
    session.commit()

    # perihelion=0.8 AU, aphelion=1.2 AU → Earth-crossing
    session.add(
        AsteroidOrbit(
            asteroid_id=crossing.id,
            epoch_mjd=60200.5,
            semi_major_axis_au=1.0,
            eccentricity=0.2,
            inclination_deg=5.0,
            longitude_of_ascending_node_deg=80.0,
            argument_of_periapsis_deg=30.0,
            mean_anomaly_deg=10.0,
            orbital_period_days=365.0,
        )
    )
    # perihelion=2.25 AU, aphelion=2.75 AU → not Earth-crossing
    session.add(
        AsteroidOrbit(
            asteroid_id=non_crossing.id,
            epoch_mjd=60200.5,
            semi_major_axis_au=2.5,
            eccentricity=0.1,
            inclination_deg=3.0,
            longitude_of_ascending_node_deg=90.0,
            argument_of_periapsis_deg=45.0,
            mean_anomaly_deg=20.0,
            orbital_period_days=1445.0,
        )
    )
    session.commit()

    results = list_asteroids_for_visualization(
        session,
        limit=500,
        earth_crossing_only=True,
        nasa_jpl_ids=[crossing_id, non_crossing_id],
    )

    ids = [r["nasa_jpl_id"] for r in results]

    # Cleanup
    session.query(AsteroidOrbit).filter(
        AsteroidOrbit.asteroid_id.in_([crossing.id, non_crossing.id])
    ).delete(synchronize_session=False)
    session.query(Asteroid).filter(Asteroid.nasa_jpl_id.in_([crossing_id, non_crossing_id])).delete(
        synchronize_session=False
    )
    session.commit()
    session.close()

    assert crossing_id in ids
    assert non_crossing_id not in ids


def test_list_asteroids_for_visualization_sorted_by_prospecting_score():
    """Results should be sorted by prospecting_score ascending."""

    session = SessionLocal()
    results = list_asteroids_for_visualization(session, limit=20)
    session.close()

    scores = [r["prospecting_score"] for r in results]
    assert scores == sorted(scores)
