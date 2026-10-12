import enum
from datetime import datetime, time
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AvailabilityTier(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    FULL = "FULL"


class FacilityStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    MAINTENANCE = "MAINTENANCE"
    FULL = "FULL"


class FacilityBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    address: str = Field(..., max_length=500)
    latitude: float
    longitude: float
    total_capacity: int = Field(default=50, ge=1)
    available_capacity: int = Field(default=50, ge=0)
    price_per_hour: float = Field(default=50.0, ge=0.0)
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    security_available: bool = True
    ev_charging_available: bool = False
    accessible_parking: bool = False
    rating: Optional[float] = 0.0
    status: FacilityStatusEnum = FacilityStatusEnum.OPEN


class FacilityCreate(FacilityBase):
    operator_id: Optional[int] = None


class FacilityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_capacity: Optional[int] = None
    available_capacity: Optional[int] = None
    price_per_hour: Optional[float] = None
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    security_available: Optional[bool] = None
    ev_charging_available: Optional[bool] = None
    accessible_parking: Optional[bool] = None
    rating: Optional[float] = None
    status: Optional[FacilityStatusEnum] = None


class SpotSummary(BaseModel):
    id: int
    spot_number: str
    floor: str
    spot_type: str
    status: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class OccupancySnapshotSummary(BaseModel):
    id: int
    occupied_spots: int
    total_spots: int
    occupancy_rate: float
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FacilityResponse(FacilityBase):
    id: int
    operator_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Calculated discovery properties
    occupancy_percentage: float = 0.0
    availability_tier: AvailabilityTier = AvailabilityTier.HIGH
    distance_km: Optional[float] = None
    distance_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FacilityDetailResponse(FacilityResponse):
    spots: List[SpotSummary] = []
    recent_occupancy: List[OccupancySnapshotSummary] = []


class NearbyFacilityItem(BaseModel):
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    distance_km: float
    distance_text: str
    total_capacity: int
    available_spaces: int
    occupancy_percentage: float
    availability_tier: AvailabilityTier
    price_per_hour: float
    rating: Optional[float] = 0.0
    security_available: bool
    ev_charging_available: bool
    accessible_parking: bool
    status: str
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class NearbyFacilityResponse(BaseModel):
    items: List[NearbyFacilityItem]
    total: int
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    radius_km: Optional[float] = None

