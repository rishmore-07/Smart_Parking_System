import enum
from sqlalchemy import Column, Integer, String, Float, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    RAZORPAY = "razorpay"
    WALLET = "wallet"
    CARD = "card"
    UPI = "upi"
    TEST_MOCK = "test_mock"


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.RAZORPAY, nullable=False)

    razorpay_order_id = Column(String(100), nullable=True, index=True)
    razorpay_payment_id = Column(String(100), nullable=True, index=True)
    razorpay_signature = Column(String(255), nullable=True)

    # Relationships
    reservation = relationship("Reservation", back_populates="payment")
    user = relationship("User")
    receipt = relationship("Receipt", back_populates="payment", uselist=False, cascade="all, delete-orphan")


class Receipt(Base, TimestampMixin):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    receipt_number = Column(String(100), unique=True, nullable=False, index=True)
    pdf_url = Column(String(512), nullable=True)
    tax_amount = Column(Float, default=0.0, nullable=False)
    subtotal_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    details_json = Column(Text, nullable=True)

    # Relationships
    payment = relationship("Payment", back_populates="receipt")
