from datetime import date, timedelta

_N_EARTH = 360.0 / 365.25  # deg/day — Earth mean motion
_MJD_J2000 = 51544.5  # MJD of J2000.0
_EARTH_L0 = 100.464  # Earth mean longitude at J2000.0 (deg)


def transit_days(target_sma_au: float) -> float:
    """Half-period of the Hohmann transfer ellipse between Earth and target_sma_au."""
    a_t = (1.0 + target_sma_au) / 2.0
    return 365.25 * (a_t**1.5) / 2.0


def _earth_longitude_deg(mjd: float) -> float:
    days = mjd - _MJD_J2000
    return (_EARTH_L0 + _N_EARTH * days) % 360.0


def _asteroid_longitude_deg(
    a: float,
    e: float,
    om: float,
    w: float,
    ma_epoch: float,
    epoch_mjd: float,
    mjd: float,
) -> float:
    n_ast = 360.0 / (365.25 * a**1.5)
    days = mjd - epoch_mjd
    ma = (ma_epoch + n_ast * days) % 360.0
    return (om + w + ma) % 360.0


def _format_date(mjd: float) -> str:
    j2000 = date(2000, 1, 1) + timedelta(days=0.5)  # J2000.0 = 2000-01-01T12:00
    d = j2000 + timedelta(days=mjd - _MJD_J2000)
    return d.strftime("%Y-%m-%d")


def format_window_label(days_until: float) -> str:
    if days_until < 14:
        return "Open now!"
    years = int(days_until // 365)
    months = int((days_until % 365) // 30)
    if years == 0:
        return f"Opens in {months}m"
    return f"Opens in {years}y {months}m"


def _format_repeat_label(synodic_days: float) -> str:
    years = synodic_days / 365.25
    if years >= 2.0:
        return f"Windows repeat every {years:.1f} years"
    months = synodic_days / 30.44
    return f"Windows repeat every {months:.0f} months"


def compute_launch_window(
    a: float,
    e: float,
    i_deg: float,
    epoch_mjd: float,
    current_mjd: float,
    om_deg: float = 0.0,
    w_deg: float = 0.0,
    ma_epoch_deg: float = 0.0,
) -> dict:
    """
    Compute the next Hohmann transfer window from Earth to an asteroid.

    Uses mean-longitude phase-angle analysis (assumes low-eccentricity approximation
    for the asteroid's mean longitude). This gives ±few-percent accuracy for the
    window timing without requiring numerical orbit propagation.

    Returns a dict with:
      days_until_window, transit_days, synodic_period_days,
      launch_date, arrival_date, window_label, repeat_label
    """
    n_ast = 360.0 / (365.25 * a**1.5)
    t_transit = transit_days(a)

    # Phase angle Earth must be behind asteroid at departure (outer) or ahead (inner)
    phi_required = (180.0 - n_ast * t_transit) % 360.0

    l_earth = _earth_longitude_deg(current_mjd)
    l_ast = _asteroid_longitude_deg(a, e, om_deg, w_deg, ma_epoch_deg, epoch_mjd, current_mjd)
    current_phase = (l_ast - l_earth) % 360.0

    rel_motion = n_ast - _N_EARTH  # deg/day: negative = outer, positive = inner

    if abs(rel_motion) < 1e-6:
        # Nearly co-orbital — synodic period is effectively infinite
        return {
            "days_until_window": None,
            "transit_days": round(t_transit, 1),
            "synodic_period_days": None,
            "launch_date": None,
            "arrival_date": None,
            "window_label": "Co-orbital — no standard window",
            "repeat_label": "Synodic period undefined",
        }

    if rel_motion < 0:
        # Outer asteroid: Earth closes on asteroid; wait for correct lead angle
        angle_to_go = (current_phase - phi_required) % 360.0
        days_until = angle_to_go / abs(rel_motion)
    else:
        # Inner asteroid: asteroid closes on Earth
        angle_to_go = (phi_required - current_phase) % 360.0
        days_until = angle_to_go / abs(rel_motion)

    synodic = 360.0 / abs(rel_motion)

    launch_mjd = current_mjd + days_until
    arrival_mjd = launch_mjd + t_transit

    return {
        "days_until_window": round(days_until, 1),
        "transit_days": round(t_transit, 1),
        "synodic_period_days": round(synodic, 1),
        "launch_date": _format_date(launch_mjd),
        "arrival_date": _format_date(arrival_mjd),
        "window_label": format_window_label(days_until),
        "repeat_label": _format_repeat_label(synodic),
    }
