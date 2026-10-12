import math
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.repositories.base_repo import BaseRepository
from app.models.facility import ParkingFacility, FacilityStatus


def calculate_haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Compute great-circle distance between two geographic coordinates in kilometers.
    """
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class FacilityRepository(BaseRepository[ParkingFacility]):
    def __init__(self):
        super().__init__(ParkingFacility)

    def search_and_filter(
        self,
        db: Session,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: Optional[float] = None,
        query_text: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_available: Optional[int] = None,
        has_ev: Optional[bool] = None,
        has_accessibility: Optional[bool] = None,
        has_security: Optional[bool] = None,
        min_rating: Optional[float] = None,
        sort_by: str = "distance",  # distance, price, available, rating
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Tuple[ParkingFacility, Optional[float]]], int]:
        """
        Query facilities with dynamic filters and compute distance when coordinates are provided.
        Returns a tuple of: list of (facility, distance_km), total_count.
        """
        query = db.query(self.model)

        # Text search (by name or address)
        if query_text and query_text.strip():
            pattern = f"%{query_text.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(self.model.name).like(pattern),
                    func.lower(self.model.address).like(pattern),
                    func.lower(self.model.description).like(pattern),
                )
            )

        # Price filters
        if min_price is not None:
            query = query.filter(self.model.price_per_hour >= min_price)
        if max_price is not None:
            query = query.filter(self.model.price_per_hour <= max_price)

        # Availability filter
        if min_available is not None:
            query = query.filter(self.model.available_capacity >= min_available)

        # Feature flags
        if has_ev is not None and has_ev:
            query = query.filter(self.model.ev_charging_available == True)
        if has_accessibility is not None and has_accessibility:
            query = query.filter(self.model.accessible_parking == True)
        if has_security is not None and has_security:
            query = query.filter(self.model.security_available == True)

        # Minimum rating
        if min_rating is not None and min_rating > 0:
            query = query.filter(self.model.rating >= min_rating)

        # Fast bounding box pre-filter if radius and lat/lng are provided
        if lat is not None and lng is not None and radius_km is not None and radius_km > 0:
            lat_offset = radius_km / 111.0
            lng_offset = radius_km / (111.0 * max(0.2, math.cos(math.radians(lat))))
            query = query.filter(
                self.model.latitude.between(lat - lat_offset, lat + lat_offset),
                self.model.longitude.between(lng - lng_offset, lng + lng_offset),
            )

        candidates = query.all()

        # Compute exact Haversine distance and filter strictly by radius
        results_with_distance: List[Tuple[ParkingFacility, Optional[float]]] = []
        for facility in candidates:
            dist: Optional[float] = None
            if lat is not None and lng is not None:
                dist = round(calculate_haversine_km(lat, lng, facility.latitude, facility.longitude), 2)
                if radius_km is not None and radius_km > 0 and dist > radius_km:
                    continue  # strictly inside spherical circle
            results_with_distance.append((facility, dist))

        # Sorting
        if sort_by == "price":
            results_with_distance.sort(key=lambda x: x[0].price_per_hour)
        elif sort_by == "available" or sort_by == "most_available":
            results_with_distance.sort(key=lambda x: x[0].available_capacity, reverse=True)
        elif sort_by == "rating" or sort_by == "best_rated":
            results_with_distance.sort(key=lambda x: (x[0].rating or 0.0), reverse=True)
        else:  # default "distance" or "nearest"
            if lat is not None and lng is not None:
                results_with_distance.sort(key=lambda x: (x[1] if x[1] is not None else float("inf")))
            else:
                results_with_distance.sort(key=lambda x: x[0].id)

        total_count = len(results_with_distance)
        paginated = results_with_distance[skip : skip + limit]
        return paginated, total_count


facility_repo = FacilityRepository()

