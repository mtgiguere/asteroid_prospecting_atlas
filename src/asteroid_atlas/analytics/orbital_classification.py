"""
orbital_classification.py

Orbital classification helpers for asteroid analytics.
"""


def is_earth_orbit_crossing(perihelion_au: float, aphelion_au: float) -> bool:
    """
    Determine whether an asteroid crosses Earth's orbital distance.
    """

    return perihelion_au < 1.0 and aphelion_au > 1.0