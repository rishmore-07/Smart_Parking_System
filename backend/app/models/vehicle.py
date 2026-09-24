import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class VehicleType(str, enum.Enum):
    CAR = "car"
    SUV = "suv"
    BIKE = "bike"
    EV = "ev"
    TRUCK = "truck"


class Vehicle(Base, TimestampMixin):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    license_plate = Column(String(50), nullable=False, index=True)
    make = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    color = Column(String(50), nullable=True)
    vehicle_type = Column(Enum(VehicleType), default=VehicleType.CAR, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="vehicles")
    reservations = relationship("Reservation", back_populates="vehicle")
    parking_sessions = relationship("ParkingSession", back_populates="vehicle")
