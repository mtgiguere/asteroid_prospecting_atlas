"""
test_jpl_bulk_normalization.py
"""

import pytest

from asteroid_atlas.ingest.jpl_bulk import normalize_bulk_row
from asteroid_atlas.ingest.models import NormalizedAsteroid, NormalizedAsteroidOrbit

FIELDS = [
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
    "spec_B",
]

FULL_ROW = [
    "2000433",
    "433 Eros (1898 DQ)",
    "10.31",
    "16.84",
    "0.25",
    "0.2228",
    "1.4580",
    "10.827",
    "304.299",
    "178.641",
    "358.1",
    "642.997",
    "60200.5",
    "S",
]


def test_normalize_bulk_row_returns_asteroid_and_orbit():
    asteroid, orbit = normalize_bulk_row(FIELDS, FULL_ROW)

    assert isinstance(asteroid, NormalizedAsteroid)
    assert asteroid.nasa_jpl_id == "2000433"
    assert asteroid.name == "433 Eros (1898 DQ)"
    assert asteroid.absolute_magnitude_h == pytest.approx(10.31)
    assert asteroid.estimated_diameter_km == pytest.approx(16.84)
    assert asteroid.albedo == pytest.approx(0.25)

    assert isinstance(orbit, NormalizedAsteroidOrbit)
    assert orbit.semi_major_axis_au == pytest.approx(1.4580)
    assert orbit.eccentricity == pytest.approx(0.2228)
    assert orbit.inclination_deg == pytest.approx(10.827)
    assert orbit.epoch_mjd == pytest.approx(60200.5)


def test_normalize_bulk_row_missing_orbit_fields_returns_none_orbit():
    row = [
        "2000433",
        "433 Eros (1898 DQ)",
        "10.31",
        "16.84",
        "0.25",
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    ]
    asteroid, orbit = normalize_bulk_row(FIELDS, row)

    assert isinstance(asteroid, NormalizedAsteroid)
    assert orbit is None


def test_normalize_bulk_row_partial_orbit_returns_none_orbit():
    row = [
        "2000433",
        "433 Eros (1898 DQ)",
        "10.31",
        "16.84",
        "0.25",
        "0.22",
        "1.45",
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    ]
    _, orbit = normalize_bulk_row(FIELDS, row)

    assert orbit is None


def test_normalize_bulk_row_missing_physical_props_is_ok():
    row = [
        "2000433",
        "433 Eros (1898 DQ)",
        None,
        None,
        None,
        "0.2228",
        "1.4580",
        "10.827",
        "304.299",
        "178.641",
        "358.1",
        "642.997",
        "60200.5",
        None,
    ]
    asteroid, orbit = normalize_bulk_row(FIELDS, row)

    assert asteroid.absolute_magnitude_h is None
    assert asteroid.estimated_diameter_km is None
    assert asteroid.albedo is None
    assert orbit is not None


def test_normalize_bulk_row_missing_spkid_raises():
    row = [
        None,
        "433 Eros",
        "10.31",
        "16.84",
        "0.25",
        "0.22",
        "1.45",
        "10.0",
        "300.0",
        "170.0",
        "350.0",
        "640.0",
        "60200.5",
        None,
    ]
    with pytest.raises(ValueError):
        normalize_bulk_row(FIELDS, row)


def test_normalize_bulk_row_missing_name_raises():
    row = [
        "2000433",
        None,
        "10.31",
        "16.84",
        "0.25",
        "0.22",
        "1.45",
        "10.0",
        "300.0",
        "170.0",
        "350.0",
        "640.0",
        "60200.5",
        None,
    ]
    with pytest.raises(ValueError):
        normalize_bulk_row(FIELDS, row)


def test_normalize_bulk_row_parses_spectral_type():
    asteroid, _ = normalize_bulk_row(FIELDS, FULL_ROW)
    assert asteroid.spectral_type == "S"


def test_normalize_bulk_row_spectral_type_none_when_missing():
    row = [*FULL_ROW[:-1], None]
    asteroid, _ = normalize_bulk_row(FIELDS, row)
    assert asteroid.spectral_type is None
