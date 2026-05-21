"""
test_resource_profile.py
"""

import pytest

from asteroid_atlas.analytics.resource_profile import ResourceProfile, compute_resource_profile


def test_returns_resource_profile_dataclass():
    result = compute_resource_profile(spectral_type="S", diameter_km=1.0)
    assert isinstance(result, ResourceProfile)


def test_c_type_has_water():
    result = compute_resource_profile(spectral_type="C", diameter_km=1.0)
    assert result.water_mass_kg is not None
    assert result.water_mass_kg > 0


def test_s_type_has_no_water():
    result = compute_resource_profile(spectral_type="S", diameter_km=1.0)
    assert result.water_mass_kg == 0.0


def test_m_type_has_no_water():
    result = compute_resource_profile(spectral_type="M", diameter_km=1.0)
    assert result.water_mass_kg == 0.0


def test_m_type_has_highest_metal_fraction():
    c = compute_resource_profile(spectral_type="C", diameter_km=1.0)
    s = compute_resource_profile(spectral_type="S", diameter_km=1.0)
    m = compute_resource_profile(spectral_type="M", diameter_km=1.0)
    assert m.metal_mass_kg > s.metal_mass_kg
    assert m.metal_mass_kg > c.metal_mass_kg


def test_m_type_has_highest_pgm():
    c = compute_resource_profile(spectral_type="C", diameter_km=1.0)
    s = compute_resource_profile(spectral_type="S", diameter_km=1.0)
    m = compute_resource_profile(spectral_type="M", diameter_km=1.0)
    assert m.pgm_mass_kg > s.pgm_mass_kg
    assert m.pgm_mass_kg > c.pgm_mass_kg


def test_larger_asteroid_has_proportionally_more_resources():
    small = compute_resource_profile(spectral_type="S", diameter_km=1.0)
    large = compute_resource_profile(spectral_type="S", diameter_km=2.0)
    # volume scales as r^3, so 2x diameter = 8x mass
    assert large.metal_mass_kg == pytest.approx(small.metal_mass_kg * 8, rel=1e-3)


def test_none_diameter_returns_none_mass_fields():
    result = compute_resource_profile(spectral_type="S", diameter_km=None)
    assert result.estimated_mass_kg is None
    assert result.water_mass_kg is None
    assert result.metal_mass_kg is None
    assert result.pgm_mass_kg is None


def test_unknown_spectral_type_uses_fallback():
    result = compute_resource_profile(spectral_type="Z", diameter_km=1.0)
    assert result.type_group == "other"
    assert result.metal_mass_kg is not None


def test_none_spectral_type_uses_fallback():
    result = compute_resource_profile(spectral_type=None, diameter_km=1.0)
    assert result.type_group == "unknown"
    assert result.spectral_type is None


def test_why_go_here_is_nonempty_string():
    for spec in ("C", "S", "M", None):
        result = compute_resource_profile(spectral_type=spec, diameter_km=5.0)
        assert isinstance(result.why_go_here, str)
        assert len(result.why_go_here) > 20


def test_c_type_subtype_maps_to_c_group():
    result = compute_resource_profile(spectral_type="Ch", diameter_km=1.0)
    assert result.type_group == "C"


def test_s_type_subtype_maps_to_s_group():
    result = compute_resource_profile(spectral_type="Sq", diameter_km=1.0)
    assert result.type_group == "S"


def test_primary_resources_is_nonempty_list():
    result = compute_resource_profile(spectral_type="C", diameter_km=1.0)
    assert isinstance(result.primary_resources, list)
    assert len(result.primary_resources) > 0


def test_x_type_maps_to_x_group():
    result = compute_resource_profile(spectral_type="Xc", diameter_km=1.0)
    assert result.type_group == "X"
