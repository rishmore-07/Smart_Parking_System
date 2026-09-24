import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class ReportType(str, enum.Enum):
    OCCUPANCY_MISMATCH = "occupancy_mismatch"
    BLOCKED_SPOT = "blocked_spot"
    BROKEN_EQUIPMENT = "broken_equipment"
    UNAUTHORIZED_PARKING = "unauthorized_parking"
    INACCURATE_PRICE = "inaccurate_price"
    OTHER = "other"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class CommunityReport(Base, TimestampMixin):
    __tablename__ = "community_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    facility_id = Column(Integer, ForeignKey("parking_facilities.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(Enum(ReportType), default=ReportType.OCCUPANCY_MISMATCH, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING, nullable=False, index=True)
    resolution_notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="reports")
    facility = relationship("ParkingFacility", back_populates="reports")
