"""
asteroid.py
"""

from sqlalchemy import Column, Float, Integer, Text

from asteroid_atlas.models.base import Base


class Asteroid(Base):
    """ORM model for the asteroids table."""

    __tablename__ = "asteroids"

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=True)
    nasa_jpl_id = Column(Text, unique=True, nullable=True)
    absolute_magnitude_h = Column(Float, nullable=True)
    estimated_diameter_km = Column(Float, nullable=True)
    albedo = Column(Float, nullable=True)