from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.services.vehicle_service import vehicle_service

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("/", response_model=APIResponse[List[VehicleResponse]])
def get_user_vehicles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vehicles = vehicle_service.get_user_vehicles(db, current_user.id)
    return APIResponse(
        success=True,
        message="User vehicles retrieved.",
        data=vehicles
    )


@router.post("/", response_model=APIResponse[VehicleResponse], status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_in: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vehicle = vehicle_service.create_vehicle(db, current_user.id, vehicle_in)
    return APIResponse(
        success=True,
        message="Vehicle registered successfully.",
        data=vehicle
    )


@router.get("/{vehicle_id}", response_model=APIResponse[VehicleResponse])
def get_vehicle_by_id(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vehicle = vehicle_service.get_vehicle_by_id(db, current_user.id, vehicle_id)
    return APIResponse(
        success=True,
        message="Vehicle details retrieved.",
        data=vehicle
    )


@router.put("/{vehicle_id}", response_model=APIResponse[VehicleResponse])
@router.patch("/{vehicle_id}", response_model=APIResponse[VehicleResponse])
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated = vehicle_service.update_vehicle(db, current_user.id, vehicle_id, vehicle_in)
    return APIResponse(
        success=True,
        message="Vehicle updated successfully.",
        data=updated
    )


@router.delete("/{vehicle_id}", response_model=APIResponse[dict])
def delete_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vehicle_service.delete_vehicle(db, current_user.id, vehicle_id)
    return APIResponse(
        success=True,
        message="Vehicle deleted successfully.",
        data={"deleted_id": vehicle_id}
    )


@router.put("/{vehicle_id}/default", response_model=APIResponse[VehicleResponse])
@router.patch("/{vehicle_id}/default", response_model=APIResponse[VehicleResponse])
def set_default_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vehicle = vehicle_service.set_default(db, current_user.id, vehicle_id)
    return APIResponse(
        success=True,
        message="Default vehicle set.",
        data=vehicle
    )
