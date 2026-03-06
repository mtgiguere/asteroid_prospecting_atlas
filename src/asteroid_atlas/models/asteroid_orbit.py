"""
asteroid_orbit.py

ORM model for asteroid orbital elements.
"""

from sqlalchemy import Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from asteroid_atlas.models.base import Base


class AsteroidOrbit(Base):
    __tablename__ = "asteroid_orbits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asteroid_id: Mapped[int] = mapped_column(ForeignKey("asteroids.id"), nullable=False)

    epoch_mjd: Mapped[float] = mapped_column(Float, nullable=False)
    semi_major_axis_au: Mapped[float] = mapped_column(Float, nullable=False)
    eccentricity: Mapped[float] = mapped_column(Float, nullable=False)
    inclination_deg: Mapped[float] = mapped_column(Float, nullable=False)

    longitude_of_ascending_node_deg: Mapped[float] = mapped_column(Float, nullable=False)
    argument_of_periapsis_deg: Mapped[float] = mapped_column(Float, nullable=False)
    mean_anomaly_deg: Mapped[float] = mapped_column(Float, nullable=False)

    orbital_period_days: Mapped[float] = mapped_column(Float, nullable=False)