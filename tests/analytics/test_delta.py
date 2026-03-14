import pytest

from asteroid_atlas.analytics.delta_v import estimate_delta_v_au


def test_delta_v_zero_for_earth_like_orbit():
    dv = estimate_delta_v_au(semi_major_axis_au=1.0)

    assert dv == pytest.approx(0.0, abs=0.01)


def test_delta_v_increases_for_distant_orbits():
    dv1 = estimate_delta_v_au(1.2)
    dv2 = estimate_delta_v_au(2.5)

    assert dv2 > dv1


def test_delta_v_positive():
    dv = estimate_delta_v_au(1.8)

    assert dv > 0
