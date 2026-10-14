from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.payment import PaymentStatus, PaymentMethod


class PaymentOrderCreate(BaseModel):
    # Optional client notes or payment method preference
    payment_method: PaymentMethod = PaymentMethod.RAZORPAY


class PaymentOrderResponse(BaseModel):
    order_id: str = Field(..., description="Razorpay Order ID")
    amount: float = Field(..., description="Authoritative amount in currency units (e.g. INR)")
    amount_paise: int = Field(..., description="Amount in smallest currency unit (paise)")
    currency: str = Field(default="INR", description="Payment currency code")
    key_id: str = Field(..., description="Razorpay public Key ID for client checkout")
    reservation_id: int
    booking_code: str
    business_name: str = "Smart Parking Finder"
    description: str = "Parking Reservation Payment"
    notes: Optional[Dict[str, str]] = None


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str = Field(..., description="Razorpay Order ID returned from checkout")
    razorpay_payment_id: str = Field(..., description="Razorpay Payment ID returned from checkout")
    razorpay_signature: str = Field(..., description="HMAC SHA256 signature returned from checkout")
    reservation_id: Optional[int] = None


class ReceiptResponse(BaseModel):
    id: int
    receipt_number: str
    payment_id: int
    subtotal_amount: float
    tax_amount: float
    total_amount: float
    pdf_url: Optional[str] = None
    details_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: int
    reservation_id: int
    user_id: int
    amount: float
    currency: str
    status: PaymentStatus
    payment_method: PaymentMethod
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    receipt: Optional[ReceiptResponse] = None

    class Config:
        from_attributes = True


class WebhookResponse(BaseModel):
    status: str
    event: Optional[str] = None
    message: Optional[str] = None
