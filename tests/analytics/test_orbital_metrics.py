"""
test_orbital_metrics.py
"""

from asteroid_atlas.analytics.orbital_metrics import calculate_perihelion_aphelion


def test_calculate_perihelion_aphelion():
    """
    Ensure perihelion and aphelion are computed correctly.
    """

    perihelion, aphelion = calculate_perihelion_aphelion(1.458, 0.223)

    assert round(perihelion, 3) == 1.133
    assert round(aphelion, 3) == 1.783
