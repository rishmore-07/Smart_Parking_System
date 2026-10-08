from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.facility import FacilityResponse, FacilityCreate, FacilityUpdate
from app.schemas.common import APIResponse
from app.services.facility_service import facility_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/facilities", tags=["Facilities"])

@router.get("/search", response_model=APIResponse[List[FacilityResponse]])
def search_facilities(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius_km: Optional[float] = Query(5.0),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    has_ev: Optional[bool] = Query(None),
    has_accessibility: Optional[bool] = Query(None),
    has_covered: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Search and discover parking facilities with dynamic filters.
    """
    facilities = facility_service.search(
        db, lat, lng, radius_km, min_price, max_price, has_ev, has_accessibility, has_covered, skip, limit
    )
    return APIResponse(success=True, message="Facilities retrieved", data=facilities)

@router.get("/{facility_id}", response_model=APIResponse[FacilityResponse])
def get_facility(facility_id: int, db: Session = Depends(get_db)):
    """
    Get a specific facility by ID.
    """
    facility = facility_service.get_by_id(db, facility_id)
    return APIResponse(success=True, message="Facility found", data=facility)

@router.post("/", response_model=APIResponse[FacilityResponse], status_code=status.HTTP_201_CREATED)
def create_facility(
    facility_in: FacilityCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new parking facility. Only for authorized roles.
    """
    if facility_in.operator_id is None:
        facility_in.operator_id = current_user.id
    facility = facility_service.create(db, facility_in)
    return APIResponse(success=True, message="Facility created", data=facility)
