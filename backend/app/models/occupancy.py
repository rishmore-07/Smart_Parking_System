from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class FacilityOccupancySnapshot(Base):
    __tablename__ = "facility_occupancy_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("parking_facilities.id", ondelete="CASCADE"), nullable=False, index=True)
    occupied_spots = Column(Integer, nullable=False)
    total_spots = Column(Integer, nullable=False)
    occupancy_rate = Column(Float, nullable=False)  # percentage 0.0 - 100.0
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    facility = relationship("ParkingFacility", back_populates="occupancy_snapshots")
