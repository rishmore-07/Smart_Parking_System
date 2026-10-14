import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class UserRole(str, enum.Enum):
    GUEST = "guest"
    DRIVER = "driver"
    OPERATOR = "operator"
    ADMIN = "admin"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # nullable for OAuth users
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(30), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.DRIVER, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(512), nullable=True)
    auth_provider = Column(String(50), default="local", nullable=False)  # local, google

    # Relationships
    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    reports = relationship("CommunityReport", back_populates="user")
    favourites = relationship("Favourite", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    payments = relationship("Payment", back_populates="user")
