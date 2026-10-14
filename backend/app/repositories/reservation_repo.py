from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from app.repositories.base_repo import BaseRepository
from app.models.reservation import Reservation, ReservationStatus
from app.models.spot import ParkingSpot, SpotType, SpotStatus
from app.models.facility import ParkingFacility


class ReservationRepository(BaseRepository[Reservation]):
    def __init__(self):
        super().__init__(Reservation)

    def get_with_details(self, db: Session, reservation_id: int) -> Optional[Reservation]:
        return (
            db.query(Reservation)
            .options(
                joinedload(Reservation.facility),
                joinedload(Reservation.spot),
                joinedload(Reservation.vehicle),
                joinedload(Reservation.user),
                joinedload(Reservation.payment),
            )
            .filter(Reservation.id == reservation_id)
            .first()
        )

    def get_by_code(self, db: Session, booking_code: str) -> Optional[Reservation]:
        return (
            db.query(Reservation)
            .options(
                joinedload(Reservation.facility),
                joinedload(Reservation.spot),
                joinedload(Reservation.vehicle),
                joinedload(Reservation.user),
                joinedload(Reservation.payment),
            )
            .filter(Reservation.booking_code == booking_code)
            .first()
        )

    def list_for_user(
        self,
        db: Session,
        user_id: int,
        status: Optional[ReservationStatus] = None,
        filter_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Reservation]:
        query = (
            db.query(Reservation)
            .options(
                joinedload(Reservation.facility),
                joinedload(Reservation.spot),
                joinedload(Reservation.vehicle),
                joinedload(Reservation.payment),
            )
            .filter(Reservation.user_id == user_id)
        )


        now = datetime.utcnow()

        if status:
            query = query.filter(Reservation.status == status)

        if filter_type == "upcoming":
            query = query.filter(
                Reservation.status.in_([ReservationStatus.CONFIRMED, ReservationStatus.ACTIVE]),
                Reservation.end_time >= now,
            )
        elif filter_type == "past":
            query = query.filter(
                or_(
                    Reservation.status.in_([ReservationStatus.COMPLETED, ReservationStatus.EXPIRED, ReservationStatus.NO_SHOW]),
                    and_(
                        Reservation.status.in_([ReservationStatus.CONFIRMED, ReservationStatus.ACTIVE]),
                        Reservation.end_time < now,
                    ),
                )
            )
        elif filter_type == "cancelled":
            query = query.filter(Reservation.status == ReservationStatus.CANCELLED)

        return query.order_by(Reservation.start_time.desc()).offset(skip).limit(limit).all()

    def list_for_operator(
        self,
        db: Session,
        operator_id: int,
        facility_id: Optional[int] = None,
        status: Optional[ReservationStatus] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Reservation]:
        query = (
            db.query(Reservation)
            .join(ParkingFacility, Reservation.facility_id == ParkingFacility.id)
            .options(
                joinedload(Reservation.facility),
                joinedload(Reservation.spot),
                joinedload(Reservation.vehicle),
                joinedload(Reservation.user),
            )
            .filter(ParkingFacility.operator_id == operator_id)
        )

        if facility_id:
            query = query.filter(Reservation.facility_id == facility_id)
        if status:
            query = query.filter(Reservation.status == status)

        return query.order_by(Reservation.start_time.desc()).offset(skip).limit(limit).all()

    def list_for_admin(
        self,
        db: Session,
        facility_id: Optional[int] = None,
        user_id: Optional[int] = None,
        status: Optional[ReservationStatus] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Reservation]:
        query = (
            db.query(Reservation)
            .options(
                joinedload(Reservation.facility),
                joinedload(Reservation.spot),
                joinedload(Reservation.vehicle),
                joinedload(Reservation.user),
            )
        )

        if facility_id:
            query = query.filter(Reservation.facility_id == facility_id)
        if user_id:
            query = query.filter(Reservation.user_id == user_id)
        if status:
            query = query.filter(Reservation.status == status)

        return query.order_by(Reservation.start_time.desc()).offset(skip).limit(limit).all()

    def check_spot_overlap(
        self,
        db: Session,
        spot_id: int,
        start_time: datetime,
        end_time: datetime,
        exclude_id: Optional[int] = None,
    ) -> bool:
        """
        Returns True if an active reservation already overlaps with [start_time, end_time].
        Overlapping rule: start_time < existing.end_time AND end_time > existing.start_time.
        """
        active_statuses = [
            ReservationStatus.CONFIRMED,
            ReservationStatus.ACTIVE,
            ReservationStatus.PENDING,
        ]
        query = db.query(Reservation).filter(
            Reservation.spot_id == spot_id,
            Reservation.status.in_(active_statuses),
            Reservation.start_time < end_time,
            Reservation.end_time > start_time,
        )
        if exclude_id:
            query = query.filter(Reservation.id != exclude_id)
        return query.first() is not None

    def get_available_spots(
        self,
        db: Session,
        facility_id: int,
        start_time: datetime,
        end_time: datetime,
        spot_type: Optional[SpotType] = None,
        lock: bool = False,
    ) -> List[ParkingSpot]:
        """
        Finds active spots at facility without active overlapping reservations during [start_time, end_time].
        """
        active_statuses = [
            ReservationStatus.CONFIRMED,
            ReservationStatus.ACTIVE,
            ReservationStatus.PENDING,
        ]

        # Subquery of spots that have conflicts
        conflicting_spots_subquery = (
            db.query(Reservation.spot_id)
            .filter(
                Reservation.facility_id == facility_id,
                Reservation.spot_id.isnot(None),
                Reservation.status.in_(active_statuses),
                Reservation.start_time < end_time,
                Reservation.end_time > start_time,
            )
            .subquery()
        )

        query = (
            db.query(ParkingSpot)
            .filter(
                ParkingSpot.facility_id == facility_id,
                ParkingSpot.is_active.is_(True),
                ParkingSpot.status != SpotStatus.MAINTENANCE,
                ~ParkingSpot.id.in_(conflicting_spots_subquery),
            )
        )

        if spot_type:
            query = query.filter(ParkingSpot.spot_type == spot_type)

        if lock:
            # PostgreSQL row lock on candidate spot
            query = query.with_for_update()

        return query.order_by(ParkingSpot.spot_number.asc()).all()


reservation_repo = ReservationRepository()
