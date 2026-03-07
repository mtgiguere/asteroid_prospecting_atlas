"""
orbital_metrics.py

Basic orbital mechanics helper calculations.
"""

def calculate_perihelion_aphelion(semi_major_axis_au: float, eccentricity: float) -> tuple[float, float]:
    """
    Calculate perihelion and aphelion distances in astronomical units.
    """

    perihelion = semi_major_axis_au * (1 - eccentricity)
    aphelion = semi_major_axis_au * (1 + eccentricity)

    return perihelion, aphelion