import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class ReservationStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    NO_SHOW = "NO_SHOW"


class Reservation(Base, TimestampMixin):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    booking_code = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    facility_id = Column(Integer, ForeignKey("parking_facilities.id", ondelete="CASCADE"), nullable=False, index=True)
    spot_id = Column(Integer, ForeignKey("parking_spots.id", ondelete="SET NULL"), nullable=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)

    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    rate_per_hour = Column(Float, nullable=True)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.CONFIRMED, nullable=False, index=True)

    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(String(255), nullable=True)

    # Relationships
    user = relationship("User", back_populates="reservations")
    facility = relationship("ParkingFacility", back_populates="reservations")
    spot = relationship("ParkingSpot", back_populates="reservations")
    vehicle = relationship("Vehicle", back_populates="reservations")
    payment = relationship("Payment", back_populates="reservation", uselist=False, cascade="all, delete-orphan")
    parking_session = relationship("ParkingSession", back_populates="reservation", uselist=False)
