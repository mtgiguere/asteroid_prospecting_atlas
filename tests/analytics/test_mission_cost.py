"""
test_mission_cost.py

TDD for tiered mission cost model in mission_roi.py.
"""

import pytest

from asteroid_atlas.analytics.mission_roi import compute_cost_tiers

# ── constants ──────────────────────────────────────────────────────────────────

_FLYBY_COST = 300_000_000
_RENDEZVOUS_COST = 800_000_000
_SAMPLE_RETURN_COST = 2_000_000_000


# ── structure ──────────────────────────────────────────────────────────────────


def test_cost_tiers_returns_all_three_tiers():
    result = compute_cost_tiers(1_000_000_000)
    assert "flyby" in result
    assert "rendezvous" in result
    assert "sample_return" in result


def test_each_tier_has_required_keys():
    result = compute_cost_tiers(1_000_000_000)
    for tier in ("flyby", "rendezvous", "sample_return"):
        assert "cost_usd" in result[tier]
        assert "cost_label" in result[tier]
        assert "roi_ratio" in result[tier]
        assert "roi_label" in result[tier]


def test_cost_tier_costs_are_correct():
    result = compute_cost_tiers(1_000_000_000)
    assert result["flyby"]["cost_usd"] == _FLYBY_COST
    assert result["rendezvous"]["cost_usd"] == _RENDEZVOUS_COST
    assert result["sample_return"]["cost_usd"] == _SAMPLE_RETURN_COST


# ── roi ratio arithmetic ───────────────────────────────────────────────────────


def test_roi_ratio_flyby():
    result = compute_cost_tiers(600_000_000)
    assert result["flyby"]["roi_ratio"] == pytest.approx(2.0)


def test_roi_ratio_rendezvous():
    result = compute_cost_tiers(800_000_000)
    assert result["rendezvous"]["roi_ratio"] == pytest.approx(1.0)


def test_roi_ratio_sample_return():
    result = compute_cost_tiers(1_000_000_000)
    assert result["sample_return"]["roi_ratio"] == pytest.approx(0.5)


def test_roi_ratio_zero_value():
    result = compute_cost_tiers(0)
    assert result["flyby"]["roi_ratio"] == 0.0
    assert result["rendezvous"]["roi_ratio"] == 0.0
    assert result["sample_return"]["roi_ratio"] == 0.0


# ── roi labels ─────────────────────────────────────────────────────────────────


def test_roi_label_above_one_shows_x_return():
    result = compute_cost_tiers(600_000_000)
    assert result["flyby"]["roi_label"] == "2.0x return"


def test_roi_label_below_one_shows_cents_on_dollar():
    result = compute_cost_tiers(150_000_000)
    assert result["flyby"]["roi_label"] == "$0.50 per $1 spent"


def test_roi_label_exactly_one():
    result = compute_cost_tiers(300_000_000)
    assert result["flyby"]["roi_label"] == "1.0x return"


# ── cost labels ────────────────────────────────────────────────────────────────


def test_cost_labels_are_human_readable():
    result = compute_cost_tiers(1_000_000_000)
    assert result["flyby"]["cost_label"] == "$300.0M"
    assert result["rendezvous"]["cost_label"] == "$800.0M"
    assert result["sample_return"]["cost_label"] == "$2.0B"


# ── recommended tier ──────────────────────────────────────────────────────────


def test_recommended_returns_key():
    result = compute_cost_tiers(1_000_000_000)
    assert "recommended" in result


def test_recommended_sample_return_for_very_high_value():
    # $20B resource → sample_return ratio = 10x
    result = compute_cost_tiers(20_000_000_000)
    assert result["recommended"] == "sample_return"


def test_recommended_rendezvous_for_moderate_value():
    # $3B resource → rendezvous ratio = 3.75x, sample_return = 1.5x
    result = compute_cost_tiers(3_000_000_000)
    assert result["recommended"] == "rendezvous"


def test_recommended_flyby_for_low_value():
    # $400M resource → flyby ratio = 1.33x, rendezvous = 0.5x
    result = compute_cost_tiers(400_000_000)
    assert result["recommended"] == "flyby"


def test_recommended_survey_only_for_negligible_value():
    # $10M resource → flyby ratio = 0.033x — not worth any mission
    result = compute_cost_tiers(10_000_000)
    assert result["recommended"] == "survey_only"
