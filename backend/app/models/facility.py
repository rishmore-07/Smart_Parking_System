from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class ParkingFacility(Base, TimestampMixin):
    __tablename__ = "parking_facilities"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False, default="Smart City")
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    total_spots = Column(Integer, nullable=False, default=50)
    available_spots = Column(Integer, nullable=False, default=50)
    hourly_rate = Column(Float, nullable=False, default=5.0)
    is_active = Column(Boolean, default=True, nullable=False)
    has_ev_charging = Column(Boolean, default=False, nullable=False)
    has_accessibility = Column(Boolean, default=False, nullable=False)
    has_covered_roof = Column(Boolean, default=False, nullable=False)
    has_cctv_security = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(512), nullable=True)

    # Relationships
    operator = relationship("User", foreign_keys=[operator_id])
    spots = relationship("ParkingSpot", back_populates="facility", cascade="all, delete-orphan")
    occupancy_snapshots = relationship("FacilityOccupancySnapshot", back_populates="facility", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="facility")
    reviews = relationship("Review", back_populates="facility", cascade="all, delete-orphan")
    reports = relationship("CommunityReport", back_populates="facility", cascade="all, delete-orphan")
    favourites = relationship("Favourite", back_populates="facility", cascade="all, delete-orphan")
