"""
test_accessible_asteroids_endpoint.py
"""

from fastapi.testclient import TestClient

from asteroid_atlas.api.main import app

client = TestClient(app)

def test_prospectable_asteroids_endpoint_returns_list():
    """
    Ensure prospectable endpoint returns a list response.
    """

    response = client.get("/asteroids/prospectable")

    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_accessible_asteroids_endpoint_returns_list():
    """
    Ensure endpoint returns a list response.
    """

    response = client.get("/asteroids/accessible")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_accessible_asteroids_endpoint_respects_limit():
    """
    Ensure endpoint respects the limit parameter.
    """

    response = client.get("/asteroids/accessible?limit=3")

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) <= 3


def test_accessible_asteroids_endpoint_accepts_earth_crossing_filter():
    """
    Ensure endpoint accepts the earth_crossing_only parameter.
    """

    response = client.get("/asteroids/accessible?earth_crossing_only=true")

    assert response.status_code == 200
    assert isinstance(response.json(), list)

    for row in response.json():
        assert row["earth_orbit_crossing"] is True


def test_accessible_asteroids_response_schema():
    """
    Ensure response rows contain expected fields.
    """

    response = client.get("/asteroids/accessible?limit=1")

    assert response.status_code == 200

    data = response.json()

    if not data:
        return

    row = data[0]

    expected_fields = {
        "name",
        "nasa_jpl_id",
        "semi_major_axis_au",
        "eccentricity",
        "inclination_deg",
        "perihelion_au",
        "aphelion_au",
        "earth_orbit_crossing",
        "accessibility_score",
    }

    assert expected_fields.issubset(set(row.keys()))

def test_prospectable_asteroids_endpoint_respects_limit():
    """
    Ensure prospectable endpoint respects the limit parameter.
    """

    response = client.get("/asteroids/prospectable?limit=3")

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) <= 3

def test_prospectable_asteroids_endpoint_accepts_earth_crossing_filter():
    """
    Ensure prospectable endpoint accepts the earth_crossing_only parameter.
    """

    response = client.get("/asteroids/prospectable?earth_crossing_only=true")

    assert response.status_code == 200
    assert isinstance(response.json(), list)

    for row in response.json():
        assert row["earth_orbit_crossing"] is True

def test_prospectable_asteroids_response_schema():
    """
    Ensure prospectable endpoint rows contain expected fields.
    """

    response = client.get("/asteroids/prospectable?limit=1")

    assert response.status_code == 200

    data = response.json()

    if not data:
        return

    row = data[0]

    expected_fields = {
        "name",
        "nasa_jpl_id",
        "semi_major_axis_au",
        "eccentricity",
        "inclination_deg",
        "perihelion_au",
        "aphelion_au",
        "earth_orbit_crossing",
        "prospecting_score",
    }

    assert expected_fields.issubset(set(row.keys()))