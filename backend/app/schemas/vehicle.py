from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.vehicle import VehicleType


class VehicleBase(BaseModel):
    license_plate: str = Field(..., min_length=2, max_length=20)
    make: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=50)
    color: Optional[str] = Field(None, max_length=30)
    vehicle_type: VehicleType = VehicleType.CAR
    is_default: bool = False


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    license_plate: Optional[str] = Field(None, min_length=2, max_length=20)
    make: Optional[str] = Field(None, min_length=1, max_length=50)
    model: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, max_length=30)
    vehicle_type: Optional[VehicleType] = None
    is_default: Optional[bool] = None


class VehicleResponse(VehicleBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
