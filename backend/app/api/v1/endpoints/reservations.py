from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_operator, require_admin
from app.models.user import User
from app.models.reservation import ReservationStatus
from app.schemas.common import APIResponse
from app.schemas.reservation import (
    ReservationCreate,
    ReservationResponse,
    ReservationEstimateRequest,
    ReservationEstimateResponse,
    ReservationCancelRequest,
    ReservationStatusUpdate,
    FacilityAvailabilityResponse,
    SpaceAvailabilityItem,
)
from app.services.reservation_service import reservation_service
from app.repositories.reservation_repo import reservation_repo

router = APIRouter(prefix="/reservations", tags=["Reservations"])
operator_router = APIRouter(prefix="/operator/reservations", tags=["Operator Reservations"])
admin_router = APIRouter(prefix="/admin/reservations", tags=["Admin Reservations"])
facility_avail_router = APIRouter(prefix="/facilities", tags=["Facility Availability"])


# --- Driver Reservation Endpoints ---

@router.post("/", response_model=APIResponse[ReservationResponse], status_code=status.HTTP_201_CREATED)
@router.post("", response_model=APIResponse[ReservationResponse], status_code=status.HTTP_201_CREATED)
def create_reservation(
    payload: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new confirmed parking reservation for an authenticated driver.
    Performs server-side validation, fee calculation, and row-level locked concurrency checks.
    """
    reservation = reservation_service.create_reservation(db, current_user, payload)
    return APIResponse(
        success=True,
        message="Reservation confirmed successfully.",
        data=reservation,
    )


@router.post("/estimate", response_model=APIResponse[ReservationEstimateResponse])
def estimate_reservation(
    payload: ReservationEstimateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate server-side fee breakdown and verify space availability before driver confirmation.
    """
    estimate = reservation_service.estimate_price(db, payload)
    return APIResponse(
        success=True,
        message="Reservation estimate calculated.",
        data=estimate,
    )


@router.get("/me", response_model=APIResponse[List[ReservationResponse]])
def get_my_reservations(
    filter_type: Optional[str] = Query(None, description="upcoming, past, cancelled"),
    status_filter: Optional[ReservationStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all reservations for the authenticated driver with filtering by status and timeframe.
    """
    reservations = reservation_repo.list_for_user(
        db=db,
        user_id=current_user.id,
        status=status_filter,
        filter_type=filter_type,
        skip=skip,
        limit=limit,
    )
    return APIResponse(
        success=True,
        message="Driver reservations retrieved.",
        data=reservations,
    )


@router.get("/{reservation_id}", response_model=APIResponse[ReservationResponse])
def get_reservation_detail(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve details for a single reservation. Driver can only access their own.
    """
    reservation = reservation_service.get_reservation_for_user(db, current_user, reservation_id)
    return APIResponse(
        success=True,
        message="Reservation details retrieved.",
        data=reservation,
    )


@router.post("/{reservation_id}/cancel", response_model=APIResponse[ReservationResponse])
def cancel_reservation(
    reservation_id: int,
    payload: Optional[ReservationCancelRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cancel an eligible reservation prior to its scheduled start time.
    Releases reserved spot capacity and sets status to CANCELLED.
    """
    reason = payload.reason if payload else "Cancelled by driver"
    cancelled = reservation_service.cancel_reservation(db, current_user, reservation_id, reason=reason)
    return APIResponse(
        success=True,
        message="Reservation successfully cancelled.",
        data=cancelled,
    )


# --- Facility Availability Endpoints ---

@facility_avail_router.get("/{facility_id}/availability", response_model=APIResponse[FacilityAvailabilityResponse])
def get_facility_time_availability(
    facility_id: int,
    start_time: datetime = Query(..., description="ISO 8601 start timestamp"),
    end_time: datetime = Query(..., description="ISO 8601 end timestamp"),
    db: Session = Depends(get_db),
):
    """
    Get aggregated facility availability status for a specific future or current time window.
    """
    avail = reservation_service.get_facility_availability(db, facility_id, start_time, end_time)
    return APIResponse(
        success=True,
        message="Facility availability retrieved.",
        data=avail,
    )


@facility_avail_router.get("/{facility_id}/spaces/availability", response_model=APIResponse[List[SpaceAvailabilityItem]])
def get_facility_spaces_availability(
    facility_id: int,
    start_time: datetime = Query(..., description="ISO 8601 start timestamp"),
    end_time: datetime = Query(..., description="ISO 8601 end timestamp"),
    db: Session = Depends(get_db),
):
    """
    Get spot-by-spot availability breakdown for a facility over a specific time window.
    """
    spaces = reservation_service.get_facility_spaces(db, facility_id, start_time, end_time)
    return APIResponse(
        success=True,
        message="Facility spaces availability retrieved.",
        data=spaces,
    )


# --- Operator Reservation Endpoints ---

@operator_router.get("/", response_model=APIResponse[List[ReservationResponse]])
@operator_router.get("", response_model=APIResponse[List[ReservationResponse]])
def get_operator_reservations(
    facility_id: Optional[int] = Query(None),
    status_filter: Optional[ReservationStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_operator: User = Depends(require_operator),
    db: Session = Depends(get_db),
):
    """
    List all reservations for facilities owned by the authenticated operator.
    """
    reservations = reservation_repo.list_for_operator(
        db=db,
        operator_id=current_operator.id,
        facility_id=facility_id,
        status=status_filter,
        skip=skip,
        limit=limit,
    )
    return APIResponse(
        success=True,
        message="Operator facility reservations retrieved.",
        data=reservations,
    )


@operator_router.get("/{reservation_id}", response_model=APIResponse[ReservationResponse])
def get_operator_reservation_detail(
    reservation_id: int,
    current_operator: User = Depends(require_operator),
    db: Session = Depends(get_db),
):
    """
    Get details of a reservation belonging to an operator's facility.
    """
    reservation = reservation_service.get_reservation_for_user(db, current_operator, reservation_id)
    return APIResponse(
        success=True,
        message="Operator reservation details retrieved.",
        data=reservation,
    )


@operator_router.patch("/{reservation_id}/status", response_model=APIResponse[ReservationResponse])
def update_reservation_status_operator(
    reservation_id: int,
    payload: ReservationStatusUpdate,
    current_operator: User = Depends(require_operator),
    db: Session = Depends(get_db),
):
    """
    Operator status update (e.g. mark ACTIVE, COMPLETED, or NO_SHOW).
    """
    updated = reservation_service.operator_update_status(db, current_operator, reservation_id, payload.status)
    return APIResponse(
        success=True,
        message=f"Reservation status updated to {payload.status.value}.",
        data=updated,
    )


# --- Admin Reservation Endpoints ---

@admin_router.get("/", response_model=APIResponse[List[ReservationResponse]])
@admin_router.get("", response_model=APIResponse[List[ReservationResponse]])
def get_admin_reservations(
    facility_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    status_filter: Optional[ReservationStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Admin global view of all reservations across all facilities.
    """
    reservations = reservation_repo.list_for_admin(
        db=db,
        facility_id=facility_id,
        user_id=user_id,
        status=status_filter,
        skip=skip,
        limit=limit,
    )
    return APIResponse(
        success=True,
        message="Admin platform reservations retrieved.",
        data=reservations,
    )


@admin_router.get("/{reservation_id}", response_model=APIResponse[ReservationResponse])
def get_admin_reservation_detail(
    reservation_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Admin detailed reservation audit view.
    """
    reservation = reservation_service.get_reservation_for_user(db, current_admin, reservation_id)
    return APIResponse(
        success=True,
        message="Admin reservation details retrieved.",
        data=reservation,
    )
