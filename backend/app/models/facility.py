from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, Time, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin
import enum

class FacilityStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    MAINTENANCE = "MAINTENANCE"
    FULL = "FULL"

class ParkingFacility(Base, TimestampMixin):
    __tablename__ = "parking_facilities"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    
    total_capacity = Column(Integer, nullable=False, default=50)
    available_capacity = Column(Integer, nullable=False, default=50)
    price_per_hour = Column(Float, nullable=False, default=5.0)
    
    opening_time = Column(Time, nullable=True)
    closing_time = Column(Time, nullable=True)
    
    security_available = Column(Boolean, default=True, nullable=False)
    ev_charging_available = Column(Boolean, default=False, nullable=False)
    accessible_parking = Column(Boolean, default=False, nullable=False)
    
    rating = Column(Float, nullable=True, default=0.0)
    status = Column(Enum(FacilityStatus), nullable=False, default=FacilityStatus.OPEN)

    # Relationships
    operator = relationship("User", foreign_keys=[operator_id])
    spots = relationship("ParkingSpot", back_populates="facility", cascade="all, delete-orphan")
    occupancy_snapshots = relationship("FacilityOccupancySnapshot", back_populates="facility", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="facility")
    reviews = relationship("Review", back_populates="facility", cascade="all, delete-orphan")
    reports = relationship("CommunityReport", back_populates="facility", cascade="all, delete-orphan")
    favourites = relationship("Favourite", back_populates="facility", cascade="all, delete-orphan")
