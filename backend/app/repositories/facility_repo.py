from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, cast, Float
from app.repositories.base_repo import BaseRepository
from app.models.facility import ParkingFacility


class FacilityRepository(BaseRepository[ParkingFacility]):
    def __init__(self):
        super().__init__(ParkingFacility)

    def get_by_city(self, db: Session, city: str, skip: int = 0, limit: int = 100) -> List[ParkingFacility]:
        return db.query(self.model).filter(
            func.lower(self.model.city) == func.lower(city)
        ).offset(skip).limit(limit).all()

    def search_facilities(
        self,
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
    ) -> List[ParkingFacility]:
        query = db.query(self.model).filter(self.model.is_active == True)
        
        if min_price is not None:
            query = query.filter(self.model.hourly_rate >= min_price)
        if max_price is not None:
            query = query.filter(self.model.hourly_rate <= max_price)
        if has_ev is not None:
            query = query.filter(self.model.has_ev_charging == has_ev)
        if has_accessibility is not None:
            query = query.filter(self.model.has_accessibility == has_accessibility)
        if has_covered is not None:
            query = query.filter(self.model.has_covered_roof == has_covered)
            
        if lat is not None and lng is not None and radius_km is not None:
            # Haversine approximation in SQLite/Postgres. 
            # 1 deg lat = 111km, 1 deg lng = 111 * cos(lat)
            # Simplistic bounding box for now or custom math
            # We'll just do a bounding box filter for simplicity
            lat_offset = radius_km / 111.0
            lng_offset = radius_km / (111.0 * 0.8) # approx cos(lat)
            
            query = query.filter(
                self.model.latitude.between(lat - lat_offset, lat + lat_offset),
                self.model.longitude.between(lng - lng_offset, lng + lng_offset)
            )

        return query.offset(skip).limit(limit).all()

facility_repo = FacilityRepository()
