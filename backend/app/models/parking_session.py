from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class ParkingSession(Base, TimestampMixin):
    __tablename__ = "parking_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="SET NULL"), nullable=True, index=True)
    facility_id = Column(Integer, ForeignKey("parking_facilities.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)

    # Saved parked vehicle location (Vehicle Finder)
    parked_latitude = Column(Float, nullable=True)
    parked_longitude = Column(Float, nullable=True)
    floor_or_zone = Column(String(50), nullable=True)
    spot_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)

    entered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    exited_at = Column(DateTime, nullable=True)
    is_active = Column(Integer, default=1, nullable=False, index=True)  # 1: active, 0: completed

    # Relationships
    user = relationship("User")
    reservation = relationship("Reservation", back_populates="parking_session")
    facility = relationship("ParkingFacility")
    vehicle = relationship("Vehicle", back_populates="parking_sessions")
