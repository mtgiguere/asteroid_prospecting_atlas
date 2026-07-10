"""
delta_v.py
Delta-v estimation utilities for asteroid transfers.
"""

import math

V_EARTH = 29.784  # km/s — Earth's mean heliocentric orbital speed at 1 AU


def estimate_delta_v(a: float, e: float, i_deg: float) -> float:
    """
    Estimate minimum heliocentric delta-v (km/s) for an Earth → asteroid rendezvous.

    Uses a two-impulse transfer:
    - Departure: Hohmann from Earth's orbit to the best intercept point on the
      asteroid orbit (perihelion, aphelion, or r=1 AU for Earth-crossers).
    - Arrival: combined velocity-match + plane-change maneuver (optimal split).

    Validated against textbook Hohmann values:
      Mars (a=1.524, e=0.093, i=1.85°) ≈ 5.6 km/s
      Bennu (a=1.126, e=0.204, i=6.03°) ≈ 3.5 km/s
    """
    q = a * (1.0 - e)  # perihelion (AU)
    Q = a * (1.0 + e)  # aphelion (AU)

    # Choose intercept point: r=1 AU for crossers, else nearest orbital extreme
    if q <= 1.0 <= Q:
        r_int = 1.0
    elif q > 1.0:
        r_int = q  # asteroid is entirely outside Earth's orbit
    else:
        r_int = Q  # asteroid is entirely inside Earth's orbit

    # Transfer orbit semi-major axis (Earth departure at r=1 AU, arrival at r_int)
    a_t = (1.0 + r_int) / 2.0

    # Velocities at the intercept point (vis-viva, normalised to V_EARTH at 1 AU)
    v_t1 = V_EARTH * math.sqrt(2.0 * r_int / (1.0 + r_int))  # transfer at r=1
    v_t2 = V_EARTH * math.sqrt(max(0.0, 2.0 / r_int - 1.0 / a_t))  # transfer at r_int
    v_ast = V_EARTH * math.sqrt(max(0.0, 2.0 / r_int - 1.0 / a))  # asteroid at r_int

    dv_depart = abs(v_t1 - V_EARTH)

    # Combined arrival + plane-change: always cheaper than doing them separately
    i_rad = math.radians(i_deg)
    dv_arrive = math.sqrt(v_t2**2 + v_ast**2 - 2.0 * v_t2 * v_ast * math.cos(i_rad))

    return dv_depart + dv_arrive
