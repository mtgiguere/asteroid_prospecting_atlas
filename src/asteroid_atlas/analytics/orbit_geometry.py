"""
orbit_geometry.py

Helpers for generating 3D orbit geometry from orbital elements.
"""

import math


def generate_orbit_points(
    semi_major_axis_au: float,
    eccentricity: float,
    inclination_deg: float,
    longitude_of_ascending_node_deg: float,
    argument_of_periapsis_deg: float,
    num_points: int = 200,
) -> list[tuple[float, float, float]]:
    """
    Generate 3D orbit points from orbital elements.
    """

    inclination_rad = math.radians(inclination_deg)
    ascending_node_rad = math.radians(longitude_of_ascending_node_deg)
    periapsis_rad = math.radians(argument_of_periapsis_deg)

    points = []

    for step in range(num_points):
        true_anomaly = 2 * math.pi * step / num_points
        radius = (
            semi_major_axis_au * (1 - eccentricity**2) / (1 + eccentricity * math.cos(true_anomaly))
        )

        orbital_x = radius * math.cos(true_anomaly)
        orbital_y = radius * math.sin(true_anomaly)
        orbital_z = 0.0

        cos_w = math.cos(periapsis_rad)
        sin_w = math.sin(periapsis_rad)
        x1 = orbital_x * cos_w - orbital_y * sin_w
        y1 = orbital_x * sin_w + orbital_y * cos_w
        z1 = orbital_z

        cos_i = math.cos(inclination_rad)
        sin_i = math.sin(inclination_rad)
        x2 = x1
        y2 = y1 * cos_i - z1 * sin_i
        z2 = y1 * sin_i + z1 * cos_i

        cos_om = math.cos(ascending_node_rad)
        sin_om = math.sin(ascending_node_rad)
        x3 = x2 * cos_om - y2 * sin_om
        y3 = x2 * sin_om + y2 * cos_om
        z3 = z2

        points.append((x3, y3, z3))

    return points
