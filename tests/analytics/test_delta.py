import pytest

from asteroid_atlas.analytics.delta_v import estimate_delta_v

# --- Zero cases ---

def test_zero_for_circular_coplanar_earth_orbit():
    # A perfectly Earth-like orbit needs no delta-v
    assert estimate_delta_v(a=1.0, e=0.0, i_deg=0.0) == pytest.approx(0.0, abs=1e-9)


def test_zero_departure_for_earth_crossing_orbit():
    # Earth-crossing asteroid (q < 1 < Q): departure dv is 0, only velocity-match at r=1
    # Aten-class: a=0.9, e=0.2 → q=0.72, Q=1.08, crosses Earth
    dv = estimate_delta_v(a=0.9, e=0.2, i_deg=0.0)
    assert dv >= 0.0
    assert dv < 5.0  # should be modest for coplanar crossing


# --- Ordering ---

def test_inclination_increases_delta_v():
    coplanar = estimate_delta_v(a=1.5, e=0.1, i_deg=0.0)
    inclined = estimate_delta_v(a=1.5, e=0.1, i_deg=20.0)
    assert inclined > coplanar


def test_larger_sma_increases_delta_v():
    inner = estimate_delta_v(a=1.3, e=0.1, i_deg=5.0)
    outer = estimate_delta_v(a=2.5, e=0.1, i_deg=5.0)
    assert outer > inner


def test_higher_eccentricity_affects_delta_v():
    circular = estimate_delta_v(a=2.0, e=0.0, i_deg=0.0)
    eccentric = estimate_delta_v(a=2.0, e=0.5, i_deg=0.0)
    # Eccentric orbit has perihelion closer to Earth → lower dv than circular at same sma
    assert eccentric < circular


# --- Known reference values (Hohmann, textbook) ---

def test_mars_hohmann_approx():
    # Mars: a≈1.524 AU, e≈0.093, i≈1.85° → textbook ~5.6 km/s heliocentric
    dv = estimate_delta_v(a=1.524, e=0.093, i_deg=1.85)
    assert dv == pytest.approx(5.6, abs=0.4)


def test_bennu_approx():
    # Bennu: a=1.126, e=0.204, i=6.03° → well-studied NEA, ~3-4 km/s heliocentric
    dv = estimate_delta_v(a=1.126, e=0.204, i_deg=6.03)
    assert 2.0 < dv < 5.0


# --- Always positive ---

def test_always_positive():
    cases = [
        (0.7, 0.1, 5.0),   # Aten (inner)
        (1.0, 0.1, 10.0),  # Earth-crossing, inclined
        (1.5, 0.3, 0.0),   # Apollo outer
        (2.8, 0.15, 25.0), # Main belt
    ]
    for a, e, i in cases:
        assert estimate_delta_v(a, e, i) >= 0.0
