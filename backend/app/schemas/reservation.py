from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.reservation import ReservationStatus
from app.models.spot import SpotType
from app.models.vehicle import VehicleType


class FacilityBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    price_per_hour: float
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None


class SpotBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    spot_number: str
    floor: str
    spot_type: SpotType


class VehicleBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    license_plate: str
    make: str
    model: str
    color: Optional[str] = None
    vehicle_type: VehicleType


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: str
    phone_number: Optional[str] = None


class PaymentBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: float
    currency: str
    status: str
    payment_method: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: datetime


class ReservationCreate(BaseModel):
    facility_id: int = Field(..., description="Target parking facility ID")
    vehicle_id: int = Field(..., description="Registered vehicle ID of user")
    start_time: datetime = Field(..., description="Start of reservation")
    end_time: datetime = Field(..., description="End of reservation")
    spot_id: Optional[int] = Field(None, description="Optional specific spot ID")
    spot_type: Optional[SpotType] = Field(None, description="Preferred spot type if no specific spot")

    @field_validator("end_time")
    @classmethod
    def validate_time_range(cls, v, info):
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("end_time must be strictly greater than start_time.")
        return v


class ReservationEstimateRequest(BaseModel):
    facility_id: int
    start_time: datetime
    end_time: datetime
    spot_id: Optional[int] = None
    spot_type: Optional[SpotType] = None


class ReservationEstimateResponse(BaseModel):
    facility_id: int
    start_time: datetime
    end_time: datetime
    duration_hours: float
    billed_hours: float
    rate_per_hour: float
    total_amount: float
    currency: str = "INR"
    available: bool
    available_spaces: int
    assigned_spot_id: Optional[int] = None
    assigned_spot_number: Optional[str] = None
    assigned_spot_type: Optional[str] = None
    message: Optional[str] = None


class ReservationCancelRequest(BaseModel):
    reason: Optional[str] = Field("Cancelled by driver", max_length=255)


class ReservationStatusUpdate(BaseModel):
    status: ReservationStatus


class ReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_code: str
    user_id: int
    facility_id: int
    spot_id: Optional[int] = None
    vehicle_id: int

    start_time: datetime
    end_time: datetime
    total_amount: float
    rate_per_hour: Optional[float] = None
    currency: str = "INR"
    status: ReservationStatus

    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    facility: Optional[FacilityBrief] = None
    spot: Optional[SpotBrief] = None
    vehicle: Optional[VehicleBrief] = None
    user: Optional[UserBrief] = None
    payment: Optional[PaymentBrief] = None


class FacilityAvailabilityResponse(BaseModel):
    facility_id: int
    start_time: datetime
    end_time: datetime
    is_open: bool
    total_capacity: int
    available_spaces: int
    booked_spaces: int
    tier: str


class SpaceAvailabilityItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    spot_number: str
    floor: str
    spot_type: SpotType
    is_active: bool
    is_available: bool
