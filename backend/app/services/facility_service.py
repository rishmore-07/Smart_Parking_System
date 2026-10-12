from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.facility_repo import facility_repo
from app.models.facility import ParkingFacility
from app.models.spot import ParkingSpot
from app.models.occupancy import FacilityOccupancySnapshot
from app.schemas.facility import (
    FacilityCreate,
    FacilityUpdate,
    FacilityResponse,
    FacilityDetailResponse,
    NearbyFacilityItem,
    NearbyFacilityResponse,
    AvailabilityTier,
    SpotSummary,
    OccupancySnapshotSummary,
)


def compute_availability_tier(available: int, total: int) -> AvailabilityTier:
    """
    Availability tier rule as specified in Phase 3 requirements:
      HIGH:   >= 50% available
      MEDIUM: 20% - 49% available
      LOW:    1% - 19% available
      FULL:   0 spaces available
    """
    if total <= 0 or available <= 0:
        return AvailabilityTier.FULL
    ratio = (available / total) * 100.0
    if ratio >= 50.0:
        return AvailabilityTier.HIGH
    elif ratio >= 20.0:
        return AvailabilityTier.MEDIUM
    else:
        return AvailabilityTier.LOW


def format_distance(distance_km: Optional[float]) -> Optional[str]:
    """
    Format distance in meters if < 1 km, otherwise kilometers with 1 decimal.
    Example: 350 m away, 1.2 km away
    """
    if distance_km is None:
        return None
    if distance_km < 1.0:
        meters = int(round(distance_km * 1000))
        return f"{meters} m away"
    return f"{distance_km:.1f} km away"


class FacilityService:
    @staticmethod
    def _map_to_nearby_item(facility: ParkingFacility, dist_km: Optional[float]) -> NearbyFacilityItem:
        total = facility.total_capacity
        available = facility.available_capacity
        occupancy_pct = round(((total - available) / total) * 100.0, 1) if total > 0 else 100.0
        tier = compute_availability_tier(available, total)

        return NearbyFacilityItem(
            id=facility.id,
            name=facility.name,
            address=facility.address,
            latitude=facility.latitude,
            longitude=facility.longitude,
            distance_km=dist_km if dist_km is not None else 0.0,
            distance_text=format_distance(dist_km) or "Unknown distance",
            total_capacity=total,
            available_spaces=available,
            occupancy_percentage=occupancy_pct,
            availability_tier=tier,
            price_per_hour=facility.price_per_hour,
            rating=facility.rating or 0.0,
            security_available=facility.security_available,
            ev_charging_available=facility.ev_charging_available,
            accessible_parking=facility.accessible_parking,
            status=facility.status.value if hasattr(facility.status, "value") else str(facility.status),
            opening_time=facility.opening_time.strftime("%H:%M") if facility.opening_time else None,
            closing_time=facility.closing_time.strftime("%H:%M") if facility.closing_time else None,
        )

    @classmethod
    def get_nearby(
        cls,
        db: Session,
        lat: float,
        lng: float,
        radius_km: float = 5.0,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_available: Optional[int] = None,
        has_ev: Optional[bool] = None,
        has_accessibility: Optional[bool] = None,
        has_security: Optional[bool] = None,
        min_rating: Optional[float] = None,
        sort_by: str = "distance",
        skip: int = 0,
        limit: int = 100,
    ) -> NearbyFacilityResponse:
        results, total = facility_repo.search_and_filter(
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

        items = [cls._map_to_nearby_item(fac, dist) for fac, dist in results]
        return NearbyFacilityResponse(
            items=items,
            total=total,
            center_lat=lat,
            center_lng=lng,
            radius_km=radius_km,
        )

    @classmethod
    def search(
        cls,
        db: Session,
        query_text: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: Optional[float] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_available: Optional[int] = None,
        has_ev: Optional[bool] = None,
        has_accessibility: Optional[bool] = None,
        has_security: Optional[bool] = None,
        min_rating: Optional[float] = None,
        sort_by: str = "distance",
        skip: int = 0,
        limit: int = 100,
    ) -> NearbyFacilityResponse:
        results, total = facility_repo.search_and_filter(
            db=db,
            lat=lat,
            lng=lng,
            radius_km=radius_km,
            query_text=query_text,
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

        items = [cls._map_to_nearby_item(fac, dist) for fac, dist in results]
        return NearbyFacilityResponse(
            items=items,
            total=total,
            center_lat=lat,
            center_lng=lng,
            radius_km=radius_km,
        )

    @staticmethod
    def get_by_id(
        db: Session,
        facility_id: int,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
    ) -> FacilityDetailResponse:
        facility = facility_repo.get(db, id=facility_id)
        if not facility:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")

        total = facility.total_capacity
        available = facility.available_capacity
        occupancy_pct = round(((total - available) / total) * 100.0, 1) if total > 0 else 100.0
        tier = compute_availability_tier(available, total)

        dist_km: Optional[float] = None
        if lat is not None and lng is not None:
            from app.repositories.facility_repo import calculate_haversine_km
            dist_km = round(calculate_haversine_km(lat, lng, facility.latitude, facility.longitude), 2)

        # Spots summary
        spots = (
            db.query(ParkingSpot)
            .filter(ParkingSpot.facility_id == facility_id)
            .order_by(ParkingSpot.spot_number)
            .all()
        )
        spot_summaries = [
            SpotSummary(
                id=s.id,
                spot_number=s.spot_number,
                floor=s.floor,
                spot_type=s.spot_type.value if hasattr(s.spot_type, "value") else str(s.spot_type),
                status=s.status.value if hasattr(s.status, "value") else str(s.status),
                is_active=s.is_active,
            )
            for s in spots
        ]

        # Recent occupancy snapshots (last 24)
        snapshots = (
            db.query(FacilityOccupancySnapshot)
            .filter(FacilityOccupancySnapshot.facility_id == facility_id)
            .order_by(FacilityOccupancySnapshot.recorded_at.desc())
            .limit(24)
            .all()
        )
        snapshot_summaries = [
            OccupancySnapshotSummary(
                id=sn.id,
                occupied_spots=sn.occupied_spots,
                total_spots=sn.total_spots,
                occupancy_rate=sn.occupancy_rate,
                recorded_at=sn.recorded_at,
            )
            for sn in reversed(snapshots)
        ]

        return FacilityDetailResponse(
            id=facility.id,
            operator_id=facility.operator_id,
            name=facility.name,
            description=facility.description,
            address=facility.address,
            latitude=facility.latitude,
            longitude=facility.longitude,
            total_capacity=facility.total_capacity,
            available_capacity=facility.available_capacity,
            price_per_hour=facility.price_per_hour,
            opening_time=facility.opening_time,
            closing_time=facility.closing_time,
            security_available=facility.security_available,
            ev_charging_available=facility.ev_charging_available,
            accessible_parking=facility.accessible_parking,
            rating=facility.rating,
            status=facility.status.value if hasattr(facility.status, "value") else str(facility.status),
            created_at=facility.created_at,
            updated_at=facility.updated_at,
            occupancy_percentage=occupancy_pct,
            availability_tier=tier,
            distance_km=dist_km,
            distance_text=format_distance(dist_km),
            spots=spot_summaries,
            recent_occupancy=snapshot_summaries,
        )

    @staticmethod
    def create(db: Session, facility_in: FacilityCreate) -> FacilityResponse:
        facility = facility_repo.create(db, obj_in=facility_in.model_dump())
        total = facility.total_capacity
        available = facility.available_capacity
        occupancy_pct = round(((total - available) / total) * 100.0, 1) if total > 0 else 100.0
        tier = compute_availability_tier(available, total)
        resp = FacilityResponse.model_validate(facility)
        resp.occupancy_percentage = occupancy_pct
        resp.availability_tier = tier
        return resp

    @staticmethod
    def update(db: Session, facility_id: int, facility_in: FacilityUpdate) -> FacilityResponse:
        facility = facility_repo.get(db, id=facility_id)
        if not facility:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
        updated = facility_repo.update(db, db_obj=facility, obj_in=facility_in.model_dump(exclude_unset=True))
        total = updated.total_capacity
        available = updated.available_capacity
        occupancy_pct = round(((total - available) / total) * 100.0, 1) if total > 0 else 100.0
        tier = compute_availability_tier(available, total)
        resp = FacilityResponse.model_validate(updated)
        resp.occupancy_percentage = occupancy_pct
        resp.availability_tier = tier
        return resp


facility_service = FacilityService()

