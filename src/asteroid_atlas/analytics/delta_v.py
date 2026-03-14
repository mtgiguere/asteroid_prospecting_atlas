"""
delta_v.py
Delta-v estimation utilities for asteroid transfers.
"""

import math

MU_SUN = 1.32712440018e11  # km^3/s^2
AU_KM = 149597870.7

R_EARTH_AU = 1.0


def estimate_delta_v_au(semi_major_axis_au: float) -> float:
    """
    Approximate delta-v for Earth -> asteroid transfer using a simplified
    Hohmann transfer between circular heliocentric orbits.

    Returns relative delta-v (km/s).
    """

    r1 = R_EARTH_AU * AU_KM
    r2 = semi_major_axis_au * AU_KM

    v1 = math.sqrt(MU_SUN / r1)
    v2 = math.sqrt(MU_SUN / r2)

    dv1 = v1 * (math.sqrt(2 * r2 / (r1 + r2)) - 1)
    dv2 = v2 * (1 - math.sqrt(2 * r1 / (r1 + r2)))

    return abs(dv1) + abs(dv2)
