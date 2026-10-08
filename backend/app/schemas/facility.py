from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime

class FacilityBase(BaseModel):
    name: str = Field(..., max_length=255)
    address: str = Field(..., max_length=500)
    city: str = Field(..., max_length=100)
    latitude: float
    longitude: float
    total_spots: int = Field(ge=1)
    available_spots: int = Field(ge=0)
    hourly_rate: float = Field(ge=0.0)
    is_active: bool = True
    has_ev_charging: bool = False
    has_accessibility: bool = False
    has_covered_roof: bool = False
    has_cctv_security: bool = True
    description: Optional[str] = None
    image_url: Optional[str] = None

class FacilityCreate(FacilityBase):
    operator_id: Optional[int] = None

class FacilityUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_spots: Optional[int] = None
    available_spots: Optional[int] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None
    has_ev_charging: Optional[bool] = None
    has_accessibility: Optional[bool] = None
    has_covered_roof: Optional[bool] = None
    has_cctv_security: Optional[bool] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class FacilityResponse(FacilityBase):
    id: int
    operator_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class FacilitySearch(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_km: Optional[float] = 5.0
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    has_ev: Optional[bool] = None
    has_accessibility: Optional[bool] = None
    has_covered: Optional[bool] = None
