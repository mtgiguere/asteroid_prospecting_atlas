"""
orbit_plot.py

Simple 3D visualization of asteroid orbits.
"""

import math

import matplotlib.pyplot as plt

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.models.asteroid import Asteroid
from asteroid_atlas.models.asteroid_orbit import AsteroidOrbit


def orbit_points(a, e, i_deg, num_points=200):
    """
    Generate 3D orbit points from orbital elements.
    """
    i = math.radians(i_deg)

    points = []

    for t in [2 * math.pi * x / num_points for x in range(num_points)]:
        r = a * (1 - e**2) / (1 + e * math.cos(t))

        x = r * math.cos(t)
        y = r * math.sin(t)
        z = y * math.sin(i)

        points.append((x, y, z))

    return points


def plot_orbits():
    session = SessionLocal()

    rows = (
        session.query(Asteroid, AsteroidOrbit)
        .join(AsteroidOrbit, Asteroid.id == AsteroidOrbit.asteroid_id)
        .limit(20)
        .all()
    )

    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")

    for _asteroid, orbit in rows:
        pts = orbit_points(
            orbit.semi_major_axis_au,
            orbit.eccentricity,
            orbit.inclination_deg,
        )

        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        zs = [p[2] for p in pts]

        ax.plot(xs, ys, zs)

    ax.scatter([0], [0], [0], s=100, label="Sun")

    ax.set_xlabel("X (AU)")
    ax.set_ylabel("Y (AU)")
    ax.set_zlabel("Z (AU)")

    plt.show()

    session.close()


if __name__ == "__main__":
    plot_orbits()
