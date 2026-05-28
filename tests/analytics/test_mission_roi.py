import pytest

from asteroid_atlas.analytics.mission_roi import (
    compute_fuel_fraction,
    compute_resource_value_usd,
    compute_roi_score,
    format_value_usd,
    mission_summary,
    reach_rating,
    reach_summary,
    roi_to_grade,
)

# ── resource value ─────────────────────────────────────────────────────────────


def test_resource_value_zero_when_all_none():
    assert compute_resource_value_usd(None, None, None) == 0.0


def test_resource_value_pgm_dominates():
    # 1 kg of PGM at $30k/kg >> 1 kg of metal at $10/kg
    pgm_only = compute_resource_value_usd(water_kg=None, metal_kg=None, pgm_kg=1.0)
    metal_only = compute_resource_value_usd(water_kg=None, metal_kg=1.0, pgm_kg=None)
    assert pgm_only > metal_only


def test_resource_value_additive():
    w = compute_resource_value_usd(water_kg=1.0, metal_kg=None, pgm_kg=None)
    m = compute_resource_value_usd(water_kg=None, metal_kg=1.0, pgm_kg=None)
    p = compute_resource_value_usd(water_kg=None, metal_kg=None, pgm_kg=1.0)
    combined = compute_resource_value_usd(water_kg=1.0, metal_kg=1.0, pgm_kg=1.0)
    assert combined == pytest.approx(w + m + p)


def test_resource_value_positive_for_realistic_m_type():
    # 1 km M-type: mass ~2.6e12 kg, 80% metal, 100 ppm PGM
    metal_kg = 2.6e12 * 0.80
    pgm_kg = 2.6e12 * 100e-6
    val = compute_resource_value_usd(water_kg=None, metal_kg=metal_kg, pgm_kg=pgm_kg)
    assert val > 1e12  # at least a trillion dollars


# ── format_value_usd ───────────────────────────────────────────────────────────


def test_format_trillions():
    assert format_value_usd(4.2e12) == "$4.2T"


def test_format_billions():
    assert format_value_usd(890e9) == "$890.0B"


def test_format_millions():
    assert format_value_usd(23e6) == "$23.0M"


def test_format_quadrillions():
    assert format_value_usd(1.5e15) == "$1,500.0T"


def test_format_zero():
    assert format_value_usd(0) == "$0"


# ── fuel fraction ──────────────────────────────────────────────────────────────


def test_fuel_fraction_zero_dv():
    assert compute_fuel_fraction(0.0) == pytest.approx(0.0, abs=1e-9)


def test_fuel_fraction_increases_with_dv():
    assert compute_fuel_fraction(5.0) > compute_fuel_fraction(3.0)


def test_fuel_fraction_below_one():
    assert compute_fuel_fraction(100.0) < 1.0


def test_fuel_fraction_bennu():
    # Bennu ~3.5 km/s → ~55% fuel (chemical rocket Isp 450s)
    ff = compute_fuel_fraction(3.5)
    assert 0.50 < ff < 0.62


def test_fuel_fraction_mars():
    # Mars ~5.6 km/s → ~72% fuel
    ff = compute_fuel_fraction(5.6)
    assert 0.68 < ff < 0.78


# ── reach rating ───────────────────────────────────────────────────────────────


def test_reach_easy():
    assert reach_rating(2.0) == "EASY REACH"


def test_reach_moderate():
    assert reach_rating(4.5) == "MODERATE"


def test_reach_challenging():
    assert reach_rating(7.0) == "CHALLENGING"


def test_reach_extreme():
    assert reach_rating(10.0) == "EXTREME"


def test_reach_boundary_3_5():
    # 3.5 is the EASY/MODERATE boundary — just above is MODERATE
    assert reach_rating(3.4) == "EASY REACH"
    assert reach_rating(3.5) == "MODERATE"


# ── reach summary ──────────────────────────────────────────────────────────────


def test_reach_summary_contains_fuel_percent():
    summary = reach_summary(3.5)
    assert "%" in summary


def test_reach_summary_fuel_increases_with_dv():
    low = reach_summary(2.0)
    high = reach_summary(8.0)

    # Extract percentages and compare
    def extract_pct(s):
        import re

        m = re.search(r"(\d+)%", s)
        return int(m.group(1)) if m else 0

    assert extract_pct(high) > extract_pct(low)


# ── ROI score ─────────────────────────────────────────────────────────────────


def test_roi_score_higher_for_valuable_easy_target():
    high_val_easy = compute_roi_score(resource_value_usd=1e12, delta_v_kms=3.0)
    low_val_hard = compute_roi_score(resource_value_usd=1e9, delta_v_kms=9.0)
    assert high_val_easy > low_val_hard


def test_roi_score_zero_value_gives_zero():
    assert compute_roi_score(0.0, delta_v_kms=3.5) == 0.0


def test_roi_score_positive():
    assert compute_roi_score(1e12, delta_v_kms=4.0) > 0


# ── mission grade ──────────────────────────────────────────────────────────────


def test_grade_top_score_is_exceptional():
    scores = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
    assert roi_to_grade(10.0, scores) == "EXCEPTIONAL"


def test_grade_bottom_score_is_long_shot():
    scores = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
    assert roi_to_grade(1.0, scores) == "LONG SHOT"


def test_grade_ordering():
    scores = list(range(1, 101))

    def grade_for(s):
        return roi_to_grade(s, scores)

    assert grade_for(100) == "EXCEPTIONAL"
    assert grade_for(1) == "LONG SHOT"


def test_grade_single_asteroid_is_exceptional():
    # Only one asteroid in dataset — it's the best by definition
    assert roi_to_grade(5.0, [5.0]) == "EXCEPTIONAL"


# ── mission summary ────────────────────────────────────────────────────────────


def test_mission_summary_returns_string():
    s = mission_summary(type_group="M", grade="EXCEPTIONAL", reach="EASY REACH")
    assert isinstance(s, str)
    assert len(s) > 10


def test_mission_summary_non_empty_for_all_grades():
    for grade in ("EXCEPTIONAL", "STRONG", "MODERATE", "MARGINAL", "LONG SHOT"):
        for reach in ("EASY REACH", "MODERATE", "CHALLENGING", "EXTREME"):
            s = mission_summary("S", grade, reach)
            assert len(s) > 0
