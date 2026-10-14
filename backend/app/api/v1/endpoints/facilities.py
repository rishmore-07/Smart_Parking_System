from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.facility import (
    FacilityResponse,
    FacilityDetailResponse,
    FacilityCreate,
    FacilityUpdate,
    NearbyFacilityResponse,
)
from app.schemas.common import APIResponse
from app.services.facility_service import facility_service
from app.core.deps import get_current_user, require_operator

router = APIRouter(prefix="/facilities", tags=["Facilities"])
parking_router = APIRouter(prefix="/parking", tags=["Parking Discovery"])


@router.get("/nearby", response_model=APIResponse[NearbyFacilityResponse])
def get_nearby_facilities(
    lat: float = Query(..., ge=-90.0, le=90.0, description="User or destination latitude"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="User or destination longitude"),
    radius_km: float = Query(5.0, gt=0.0, le=100.0, description="Search radius in kilometers"),
    min_price: Optional[float] = Query(None, ge=0.0),
    max_price: Optional[float] = Query(None, ge=0.0),
    min_available: Optional[int] = Query(None, ge=0),
    has_ev: Optional[bool] = Query(None),
    has_accessibility: Optional[bool] = Query(None),
    has_security: Optional[bool] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0),
    sort_by: str = Query("distance", pattern="^(distance|price|available|most_available|rating|best_rated|nearest)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Get nearby parking facilities around a given GPS coordinate using Haversine distance.
    Returns real-time/simulated availability, distance, tier, and amenity info.
    """
    results = facility_service.get_nearby(
        db=db,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        min_price=min_price,
        max_price=max_price,
        min_available=min_available,
        has_ev=has_ev,
        has_accessibility=has_accessibility,
        has_security=has_security,
        min_rating=min_rating,
        sort_by=sort_by,
        skip=skip,
        limit=limit,
    )
    return APIResponse(success=True, message="Nearby facilities retrieved", data=results)


@router.get("/search", response_model=APIResponse[NearbyFacilityResponse])
def search_facilities(
    q: Optional[str] = Query(None, description="Search query text (name, address)"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lng: Optional[float] = Query(None, ge=-180.0, le=180.0),
    radius_km: Optional[float] = Query(10.0, gt=0.0, le=100.0),
    min_price: Optional[float] = Query(None, ge=0.0),
    max_price: Optional[float] = Query(None, ge=0.0),
    min_available: Optional[int] = Query(None, ge=0),
    has_ev: Optional[bool] = Query(None),
    has_accessibility: Optional[bool] = Query(None),
    has_security: Optional[bool] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0),
    sort_by: str = Query("distance", pattern="^(distance|price|available|most_available|rating|best_rated|nearest)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Search and filter facilities by name, destination query, or coordinates with multi-criteria filters.
    """
    results = facility_service.search(
        db=db,
        query_text=q,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        min_price=min_price,
        max_price=max_price,
        min_available=min_available,
        has_ev=has_ev,
        has_accessibility=has_accessibility,
        has_security=has_security,
        min_rating=min_rating,
        sort_by=sort_by,
        skip=skip,
        limit=limit,
    )
    return APIResponse(success=True, message="Facilities retrieved", data=results)


@router.get("/{facility_id}", response_model=APIResponse[FacilityDetailResponse])
def get_facility(
    facility_id: int,
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lng: Optional[float] = Query(None, ge=-180.0, le=180.0),
    db: Session = Depends(get_db),
):
    """
    Get detailed information for a specific parking facility including spots and occupancy trends.
    """
    facility = facility_service.get_by_id(db, facility_id, lat=lat, lng=lng)
    return APIResponse(success=True, message="Facility found", data=facility)


@router.get("", response_model=APIResponse[NearbyFacilityResponse])
def list_facilities(
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lng: Optional[float] = Query(None, ge=-180.0, le=180.0),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    List all facilities.
    """
    results = facility_service.search(
        db=db,
        lat=lat,
        lng=lng,
        skip=skip,
        limit=limit,
    )
    return APIResponse(success=True, message="Facilities retrieved", data=results)


@router.post("", response_model=APIResponse[FacilityResponse], status_code=status.HTTP_201_CREATED)
def create_facility(
    facility_in: FacilityCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_operator),
):
    """
    Create a new parking facility. Only for authorized roles.
    """
    if facility_in.operator_id is None:
        facility_in.operator_id = current_user.id
    facility = facility_service.create(db, facility_in)
    return APIResponse(success=True, message="Facility created", data=facility)


# Also register handlers on parking_router so /api/parking/... behaves identically
parking_router.add_api_route("/nearby", get_nearby_facilities, methods=["GET"], response_model=APIResponse[NearbyFacilityResponse])
parking_router.add_api_route("/search", search_facilities, methods=["GET"], response_model=APIResponse[NearbyFacilityResponse])
parking_router.add_api_route("/{facility_id}", get_facility, methods=["GET"], response_model=APIResponse[FacilityDetailResponse])
parking_router.add_api_route("", list_facilities, methods=["GET"], response_model=APIResponse[NearbyFacilityResponse])

