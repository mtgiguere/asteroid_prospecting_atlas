import pytest

from asteroid_atlas.analytics.launch_window import (
    compute_launch_window,
    format_window_label,
    transit_days,
)

# ── transit time ──────────────────────────────────────────────────────────────


def test_transit_days_earth_circular():
    # Transfer from 1 AU to 1 AU: a_t = 1 AU, half-period = 365.25/2 ≈ 182.6 days
    assert transit_days(1.0) == pytest.approx(182.625, abs=0.1)


def test_transit_days_mars():
    # Hohmann to Mars SMA 1.524 AU → half-period of transfer ellipse ≈ 259 days
    t = transit_days(1.524)
    assert 250 < t < 270


def test_transit_days_increases_with_sma():
    assert transit_days(2.0) > transit_days(1.5) > transit_days(1.2)


def test_transit_days_inner_asteroid():
    # Venus SMA 0.723 AU → Hohmann from Earth inward ≈ 146 days
    t = transit_days(0.723)
    assert 130 < t < 165


# ── synodic period ────────────────────────────────────────────────────────────


def test_synodic_mars():
    # Mars synodic period ≈ 780 days (well-known)
    result = compute_launch_window(
        a=1.524, e=0.093, i_deg=1.85, epoch_mjd=51544.0, current_mjd=51544.0
    )
    assert 750 < result["synodic_period_days"] < 810


def test_synodic_venus():
    # Venus synodic period ≈ 584 days
    result = compute_launch_window(
        a=0.723, e=0.007, i_deg=3.39, epoch_mjd=51544.0, current_mjd=51544.0
    )
    assert 560 < result["synodic_period_days"] < 610


def test_synodic_very_similar_orbit_is_large():
    # Near-Earth asteroid, SMA ≈ 1.01 AU → synodic period >> 1000 days
    result = compute_launch_window(
        a=1.01, e=0.01, i_deg=1.0, epoch_mjd=51544.0, current_mjd=51544.0
    )
    assert result["synodic_period_days"] > 2000


# ── days until window ─────────────────────────────────────────────────────────


def test_days_until_non_negative():
    for a in (0.8, 1.2, 1.5, 2.5):
        result = compute_launch_window(
            a=a, e=0.1, i_deg=5.0, epoch_mjd=51544.0, current_mjd=51544.0
        )
        assert result["days_until_window"] >= 0


def test_days_until_less_than_synodic():
    for a in (0.8, 1.2, 1.5, 2.5):
        result = compute_launch_window(
            a=a, e=0.1, i_deg=5.0, epoch_mjd=51544.0, current_mjd=51544.0
        )
        assert result["days_until_window"] < result["synodic_period_days"]


def test_days_until_changes_with_current_time():
    r1 = compute_launch_window(a=1.5, e=0.1, i_deg=5.0, epoch_mjd=51544.0, current_mjd=51544.0)
    r2 = compute_launch_window(a=1.5, e=0.1, i_deg=5.0, epoch_mjd=51544.0, current_mjd=52000.0)
    # Results should differ (different phase angle)
    assert r1["days_until_window"] != r2["days_until_window"]


# ── output shape ──────────────────────────────────────────────────────────────


def test_compute_launch_window_keys():
    result = compute_launch_window(a=1.5, e=0.1, i_deg=5.0, epoch_mjd=51544.0, current_mjd=51544.0)
    assert "days_until_window" in result
    assert "transit_days" in result
    assert "synodic_period_days" in result
    assert "launch_date" in result
    assert "arrival_date" in result
    assert "window_label" in result
    assert "repeat_label" in result


def test_launch_and_arrival_dates_are_strings():
    result = compute_launch_window(a=1.5, e=0.1, i_deg=5.0, epoch_mjd=51544.0, current_mjd=51544.0)
    assert isinstance(result["launch_date"], str)
    assert isinstance(result["arrival_date"], str)


def test_arrival_after_launch():
    result = compute_launch_window(a=1.5, e=0.1, i_deg=5.0, epoch_mjd=51544.0, current_mjd=51544.0)
    # Dates are YYYY-MM-DD strings — lexicographic comparison works
    assert result["arrival_date"] >= result["launch_date"]


def test_transit_days_in_result_matches_helper():
    a = 1.524
    result = compute_launch_window(a=a, e=0.093, i_deg=1.85, epoch_mjd=51544.0, current_mjd=51544.0)
    assert result["transit_days"] == pytest.approx(transit_days(a), abs=1.0)


# ── format_window_label ───────────────────────────────────────────────────────


def test_label_open_now():
    assert format_window_label(0) == "Open now!"
    assert format_window_label(13) == "Open now!"


def test_label_months():
    assert format_window_label(180) == "Opens in 6m"


def test_label_years_and_months():
    label = format_window_label(600)
    assert "y" in label
    assert "m" in label


def test_label_exactly_one_year():
    assert format_window_label(365) == "Opens in 1y 0m"


def test_label_non_negative_days():
    # Should never receive negative days, but guard anyway
    assert isinstance(format_window_label(0), str)


def test_repeat_label_in_result():
    result = compute_launch_window(a=1.5, e=0.1, i_deg=5.0, epoch_mjd=51544.0, current_mjd=51544.0)
    assert "year" in result["repeat_label"].lower() or "month" in result["repeat_label"].lower()
