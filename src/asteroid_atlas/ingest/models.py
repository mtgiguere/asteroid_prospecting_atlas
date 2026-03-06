"""
models.py

Data models used during ingestion pipelines.
"""

from dataclasses import dataclass


@dataclass
class NormalizedAsteroid:
    """
    Normalized asteroid record produced by ingestion pipelines.
    """

    name: str
    nasa_jpl_id: str


@dataclass
class NormalizedAsteroidOrbit:
    """
    Normalized orbital elements produced by ingestion pipelines.
    """

    epoch_mjd: float
    semi_major_axis_au: float
    eccentricity: float
    inclination_deg: float
    longitude_of_ascending_node_deg: float
    argument_of_periapsis_deg: float
    mean_anomaly_deg: float
    orbital_period_days: float