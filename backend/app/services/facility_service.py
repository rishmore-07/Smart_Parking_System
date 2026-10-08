from sqlalchemy.orm import Session
from typing import List, Optional
from app.repositories.facility_repo import facility_repo
from app.schemas.facility import FacilityCreate, FacilityUpdate, FacilityResponse
from fastapi import HTTPException, status

class FacilityService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[FacilityResponse]:
        facilities = facility_repo.get_multi(db, skip=skip, limit=limit)
        return [FacilityResponse.model_validate(f) for f in facilities]

    @staticmethod
    def search(
        db: Session,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: Optional[float] = 5.0,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        has_ev: Optional[bool] = None,
        has_accessibility: Optional[bool] = None,
        has_covered: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[FacilityResponse]:
        facilities = facility_repo.search_facilities(
            db, lat, lng, radius_km, min_price, max_price, has_ev, has_accessibility, has_covered, skip, limit
        )
        return [FacilityResponse.model_validate(f) for f in facilities]

    @staticmethod
    def get_by_id(db: Session, facility_id: int) -> FacilityResponse:
        facility = facility_repo.get(db, id=facility_id)
        if not facility:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
        return FacilityResponse.model_validate(facility)

    @staticmethod
    def create(db: Session, facility_in: FacilityCreate) -> FacilityResponse:
        facility = facility_repo.create(db, obj_in=facility_in.model_dump())
        return FacilityResponse.model_validate(facility)
        
    @staticmethod
    def update(db: Session, facility_id: int, facility_in: FacilityUpdate) -> FacilityResponse:
        facility = facility_repo.get(db, id=facility_id)
        if not facility:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
        updated = facility_repo.update(db, db_obj=facility, obj_in=facility_in.model_dump(exclude_unset=True))
        return FacilityResponse.model_validate(updated)

facility_service = FacilityService()
