"""
test_orbit_geometry.py
"""

from asteroid_atlas.analytics.orbit_geometry import generate_orbit_points


def test_generate_orbit_points_returns_expected_number_of_points():
    points = generate_orbit_points(
        semi_major_axis_au=1.0,
        eccentricity=0.1,
        inclination_deg=5.0,
        longitude_of_ascending_node_deg=30.0,
        argument_of_periapsis_deg=45.0,
        num_points=50,
    )

    assert len(points) == 50


def test_generate_orbit_points_returns_xyz_tuples():
    points = generate_orbit_points(
        semi_major_axis_au=1.0,
        eccentricity=0.1,
        inclination_deg=5.0,
        longitude_of_ascending_node_deg=30.0,
        argument_of_periapsis_deg=45.0,
        num_points=10,
    )

    first = points[0]

    assert isinstance(first, tuple)
    assert len(first) == 3
    assert all(isinstance(value, float) for value in first)


def test_generate_orbit_points_changes_when_orbital_angles_change():
    points_a = generate_orbit_points(
        semi_major_axis_au=1.0,
        eccentricity=0.1,
        inclination_deg=5.0,
        longitude_of_ascending_node_deg=0.0,
        argument_of_periapsis_deg=0.0,
        num_points=20,
    )

    points_b = generate_orbit_points(
        semi_major_axis_au=1.0,
        eccentricity=0.1,
        inclination_deg=5.0,
        longitude_of_ascending_node_deg=45.0,
        argument_of_periapsis_deg=30.0,
        num_points=20,
    )

    assert points_a != points_b
