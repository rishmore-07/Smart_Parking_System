import math
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.reservation import Reservation, ReservationStatus
from app.models.facility import ParkingFacility, FacilityStatus
from app.models.spot import ParkingSpot, SpotType, SpotStatus
from app.models.vehicle import Vehicle
from app.models.user import User, UserRole
from app.repositories.reservation_repo import reservation_repo
from app.repositories.facility_repo import facility_repo
from app.schemas.reservation import (
    ReservationCreate,
    ReservationEstimateRequest,
    ReservationEstimateResponse,
    FacilityAvailabilityResponse,
    SpaceAvailabilityItem,
)


class ReservationService:
    def _validate_facility(self, db: Session, facility_id: int) -> ParkingFacility:
        facility = db.query(ParkingFacility).filter(ParkingFacility.id == facility_id).first()
        if not facility:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parking facility not found.",
            )
        if facility.status != FacilityStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Facility is currently {facility.status.value.lower()} and not accepting reservations.",
            )
        return facility

    def _validate_time_window(
        self,
        facility: ParkingFacility,
        start_time: datetime,
        end_time: datetime,
    ) -> float:
        now = datetime.utcnow()
        # Allow 5-minute clock drift
        if start_time < now - timedelta(minutes=5):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservation start time cannot be in the past.",
            )

        if end_time <= start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservation end time must be after start time.",
            )

        duration_seconds = (end_time - start_time).total_seconds()
        duration_hours = duration_seconds / 3600.0

        if duration_hours < 0.25:  # Minimum 15 minutes
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservation duration must be at least 15 minutes.",
            )

        # Check facility operating hours if configured
        if facility.opening_time and facility.closing_time:
            # If operating hours exist and are not 24h
            if facility.opening_time != facility.closing_time:
                start_tod = start_time.time()
                end_tod = end_time.time()
                if facility.opening_time < facility.closing_time:
                    # Regular daytime schedule
                    if not (facility.opening_time <= start_tod and end_tod <= facility.closing_time):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Reservation must be within facility operating hours ({facility.opening_time} to {facility.closing_time}).",
                        )

        return duration_hours

    def calculate_fee(self, facility: ParkingFacility, duration_hours: float) -> Tuple[float, float]:
        """
        Calculates fee server-side using standard hourly billing:
        billed_hours = max(1.0, math.ceil(duration_hours))
        total_amount = billed_hours * facility.price_per_hour
        """
        billed_hours = max(1.0, float(math.ceil(duration_hours)))
        total_amount = round(billed_hours * facility.price_per_hour, 2)
        return billed_hours, total_amount

    def estimate_price(self, db: Session, data: ReservationEstimateRequest) -> ReservationEstimateResponse:
        facility = self._validate_facility(db, data.facility_id)
        duration_hours = self._validate_time_window(facility, data.start_time, data.end_time)
        billed_hours, total_amount = self.calculate_fee(facility, duration_hours)

        available_spots = reservation_repo.get_available_spots(
            db=db,
            facility_id=data.facility_id,
            start_time=data.start_time,
            end_time=data.end_time,
            spot_type=data.spot_type,
            lock=False,
        )

        assigned_spot = None
        if data.spot_id:
            assigned_spot = next((s for s in available_spots if s.id == data.spot_id), None)
            is_available = assigned_spot is not None
        else:
            is_available = len(available_spots) > 0
            if is_available:
                assigned_spot = available_spots[0]

        return ReservationEstimateResponse(
            facility_id=facility.id,
            start_time=data.start_time,
            end_time=data.end_time,
            duration_hours=round(duration_hours, 2),
            billed_hours=billed_hours,
            rate_per_hour=facility.price_per_hour,
            total_amount=total_amount,
            currency="INR",
            available=is_available,
            available_spaces=len(available_spots),
            assigned_spot_id=assigned_spot.id if assigned_spot else None,
            assigned_spot_number=assigned_spot.spot_number if assigned_spot else None,
            assigned_spot_type=assigned_spot.spot_type.value if assigned_spot else None,
            message=None if is_available else "No parking spaces available for the requested time slot.",
        )

    def create_reservation(self, db: Session, user: User, data: ReservationCreate) -> Reservation:
        facility = self._validate_facility(db, data.facility_id)
        duration_hours = self._validate_time_window(facility, data.start_time, data.end_time)
        billed_hours, total_amount = self.calculate_fee(facility, duration_hours)

        # Validate vehicle ownership
        vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected vehicle not found.",
            )
        if vehicle.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create reservations for vehicles you own.",
            )

        # Spot assignment & double-booking prevention with row-level serialization
        assigned_spot: Optional[ParkingSpot] = None

        if data.spot_id:
            # Explicit spot requested
            spot = (
                db.query(ParkingSpot)
                .filter(ParkingSpot.id == data.spot_id, ParkingSpot.facility_id == data.facility_id)
                .with_for_update()
                .first()
            )
            if not spot:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Selected parking spot does not exist at this facility.",
                )
            if not spot.is_active or spot.status == SpotStatus.MAINTENANCE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Spot {spot.spot_number} is currently unavailable or under maintenance.",
                )
            if reservation_repo.check_spot_overlap(db, spot.id, data.start_time, data.end_time):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Spot {spot.spot_number} is already reserved for the requested time window.",
                )
            assigned_spot = spot
        else:
            # Auto-assign first available spot with row-level lock
            available_spots = reservation_repo.get_available_spots(
                db=db,
                facility_id=data.facility_id,
                start_time=data.start_time,
                end_time=data.end_time,
                spot_type=data.spot_type,
                lock=True,
            )
            if not available_spots:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No parking spaces are available at this facility for the requested time window.",
                )
            assigned_spot = available_spots[0]

        # Generate unique human-readable booking reference
        date_str = datetime.utcnow().strftime("%Y%m%d")
        unique_token = uuid.uuid4().hex[:6].upper()
        booking_code = f"SPF-{date_str}-{unique_token}"

        reservation = Reservation(
            booking_code=booking_code,
            user_id=user.id,
            facility_id=facility.id,
            spot_id=assigned_spot.id if assigned_spot else None,
            vehicle_id=vehicle.id,
            start_time=data.start_time,
            end_time=data.end_time,
            total_amount=total_amount,
            rate_per_hour=facility.price_per_hour,
            currency="INR",
            status=ReservationStatus.CONFIRMED,
        )

        db.add(reservation)
        db.commit()
        db.refresh(reservation)

        return reservation_repo.get_with_details(db, reservation.id)

    def cancel_reservation(
        self,
        db: Session,
        user: User,
        reservation_id: int,
        reason: Optional[str] = None,
    ) -> Reservation:
        reservation = (
            db.query(Reservation)
            .filter(Reservation.id == reservation_id)
            .with_for_update()
            .first()
        )
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found.",
            )

        # Authorization check: only owner or admin can cancel
        if reservation.user_id != user.id and user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to cancel this reservation.",
            )

        if reservation.status == ReservationStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This reservation has already been cancelled.",
            )

        if reservation.status == ReservationStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completed reservations cannot be cancelled.",
            )

        # Cancellation policy: cancellation permitted strictly prior to start time
        now = datetime.utcnow()
        if now >= reservation.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservations cannot be cancelled after the scheduled start time.",
            )

        reservation.status = ReservationStatus.CANCELLED
        reservation.cancelled_at = now
        reservation.cancellation_reason = reason or "Cancelled by driver"

        db.commit()
        db.refresh(reservation)

        return reservation_repo.get_with_details(db, reservation.id)

    def get_reservation_for_user(self, db: Session, user: User, reservation_id: int) -> Reservation:
        reservation = reservation_repo.get_with_details(db, reservation_id)
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found.",
            )
        # Check permissions: owner, operator of the facility, or admin
        if reservation.user_id != user.id and user.role != UserRole.ADMIN:
            facility = db.query(ParkingFacility).filter(ParkingFacility.id == reservation.facility_id).first()
            if not facility or facility.operator_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this reservation record.",
                )
        return reservation

    def get_facility_availability(
        self,
        db: Session,
        facility_id: int,
        start_time: datetime,
        end_time: datetime,
    ) -> FacilityAvailabilityResponse:
        facility = self._validate_facility(db, facility_id)
        available_spots = reservation_repo.get_available_spots(
            db, facility_id, start_time, end_time, lock=False
        )

        total_active_spots = (
            db.query(ParkingSpot)
            .filter(
                ParkingSpot.facility_id == facility_id,
                ParkingSpot.is_active.is_(True),
                ParkingSpot.status != SpotStatus.MAINTENANCE,
            )
            .count()
        )
        total_capacity = max(total_active_spots, facility.total_capacity)
        available_count = len(available_spots)
        booked_count = max(0, total_capacity - available_count)

        from app.services.facility_service import compute_availability_tier
        tier = compute_availability_tier(available_count, total_capacity)

        return FacilityAvailabilityResponse(
            facility_id=facility.id,
            start_time=start_time,
            end_time=end_time,
            is_open=facility.status == FacilityStatus.OPEN,
            total_capacity=total_capacity,
            available_spaces=available_count,
            booked_spaces=booked_count,
            tier=tier.value,
        )

    def get_facility_spaces(
        self,
        db: Session,
        facility_id: int,
        start_time: datetime,
        end_time: datetime,
    ) -> List[SpaceAvailabilityItem]:
        self._validate_facility(db, facility_id)
        all_spots = (
            db.query(ParkingSpot)
            .filter(ParkingSpot.facility_id == facility_id)
            .order_by(ParkingSpot.floor.asc(), ParkingSpot.spot_number.asc())
            .all()
        )

        items = []
        for s in all_spots:
            has_conflict = reservation_repo.check_spot_overlap(db, s.id, start_time, end_time)
            is_available = s.is_active and s.status != SpotStatus.MAINTENANCE and not has_conflict
            items.append(
                SpaceAvailabilityItem(
                    id=s.id,
                    spot_number=s.spot_number,
                    floor=s.floor,
                    spot_type=s.spot_type,
                    is_active=s.is_active,
                    is_available=is_available,
                )
            )
        return items

    def operator_update_status(
        self,
        db: Session,
        operator: User,
        reservation_id: int,
        new_status: ReservationStatus,
    ) -> Reservation:
        reservation = (
            db.query(Reservation)
            .join(ParkingFacility, Reservation.facility_id == ParkingFacility.id)
            .filter(Reservation.id == reservation_id, ParkingFacility.operator_id == operator.id)
            .first()
        )
        if not reservation and operator.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found or does not belong to your facilities.",
            )
        if not reservation and operator.role == UserRole.ADMIN:
            reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
            if not reservation:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found.")

        # Operators can only mark COMPLETED, ACTIVE, or NO_SHOW
        allowed_transitions = [
            ReservationStatus.ACTIVE,
            ReservationStatus.COMPLETED,
            ReservationStatus.NO_SHOW,
        ]
        if new_status not in allowed_transitions and operator.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Operators cannot set status to {new_status.value}.",
            )

        reservation.status = new_status
        if new_status == ReservationStatus.ACTIVE and not reservation.check_in_time:
            reservation.check_in_time = datetime.utcnow()
        elif new_status == ReservationStatus.COMPLETED and not reservation.check_out_time:
            reservation.check_out_time = datetime.utcnow()

        db.commit()
        db.refresh(reservation)
        return reservation_repo.get_with_details(db, reservation.id)


reservation_service = ReservationService()
