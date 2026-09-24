import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class SpotType(str, enum.Enum):
    STANDARD = "standard"
    COMPACT = "compact"
    EV = "ev"
    HANDICAPPED = "handicapped"
    BIKE = "bike"


class SpotStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"


class ParkingSpot(Base, TimestampMixin):
    __tablename__ = "parking_spots"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("parking_facilities.id", ondelete="CASCADE"), nullable=False, index=True)
    spot_number = Column(String(50), nullable=False)
    floor = Column(String(20), default="Ground", nullable=False)
    spot_type = Column(Enum(SpotType), default=SpotType.STANDARD, nullable=False)
    status = Column(Enum(SpotStatus), default=SpotStatus.AVAILABLE, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    facility = relationship("ParkingFacility", back_populates="spots")
    reservations = relationship("Reservation", back_populates="spot")
