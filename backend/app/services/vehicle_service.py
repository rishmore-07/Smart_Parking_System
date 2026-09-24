from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.repositories.vehicle_repo import vehicle_repo
from app.repositories.audit_repo import audit_repo
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


class VehicleService:
    def create_vehicle(self, db: Session, user_id: int, vehicle_in: VehicleCreate) -> Vehicle:
        existing_vehicles = vehicle_repo.get_by_user_id(db, user_id)
        
        # If this is the user's first vehicle or if marked default, make it default
        is_default = vehicle_in.is_default or len(existing_vehicles) == 0
        if is_default and len(existing_vehicles) > 0:
            vehicle_repo.unset_default_vehicles(db, user_id)

        vehicle = Vehicle(
            user_id=user_id,
            license_plate=vehicle_in.license_plate.upper().strip(),
            make=vehicle_in.make.strip(),
            model=vehicle_in.model.strip(),
            color=vehicle_in.color.strip() if vehicle_in.color else None,
            vehicle_type=vehicle_in.vehicle_type,
            is_default=is_default,
        )
        created = vehicle_repo.create(db, vehicle)

        audit_repo.log(
            db,
            action="VEHICLE_ADDED",
            user_id=user_id,
            entity_type="Vehicle",
            entity_id=str(created.id),
            details=f"Added vehicle {created.make} {created.model} ({created.license_plate})",
        )
        return created

    def get_user_vehicles(self, db: Session, user_id: int) -> List[Vehicle]:
        return vehicle_repo.get_by_user_id(db, user_id)

    def get_vehicle_by_id(self, db: Session, user_id: int, vehicle_id: int) -> Vehicle:
        vehicle = vehicle_repo.get_by_user_and_id(db, user_id, vehicle_id)
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehicle not found.",
            )
        return vehicle

    def update_vehicle(
        self, db: Session, user_id: int, vehicle_id: int, update_in: VehicleUpdate
    ) -> Vehicle:
        vehicle = self.get_vehicle_by_id(db, user_id, vehicle_id)

        if update_in.license_plate is not None:
            vehicle.license_plate = update_in.license_plate.upper().strip()
        if update_in.make is not None:
            vehicle.make = update_in.make.strip()
        if update_in.model is not None:
            vehicle.model = update_in.model.strip()
        if update_in.color is not None:
            vehicle.color = update_in.color.strip()
        if update_in.vehicle_type is not None:
            vehicle.vehicle_type = update_in.vehicle_type
        if update_in.is_default is True:
            vehicle_repo.unset_default_vehicles(db, user_id)
            vehicle.is_default = True

        db.commit()
        db.refresh(vehicle)

        audit_repo.log(
            db,
            action="VEHICLE_UPDATED",
            user_id=user_id,
            entity_type="Vehicle",
            entity_id=str(vehicle.id),
            details=f"Updated vehicle {vehicle.license_plate}",
        )
        return vehicle

    def delete_vehicle(self, db: Session, user_id: int, vehicle_id: int) -> None:
        vehicle = self.get_vehicle_by_id(db, user_id, vehicle_id)
        was_default = vehicle.is_default
        vehicle_repo.delete(db, vehicle.id)

        # If deleted vehicle was default, set another vehicle as default if one exists
        if was_default:
            remaining = vehicle_repo.get_by_user_id(db, user_id)
            if remaining:
                remaining[0].is_default = True
                db.commit()

        audit_repo.log(
            db,
            action="VEHICLE_DELETED",
            user_id=user_id,
            entity_type="Vehicle",
            entity_id=str(vehicle_id),
            details=f"Deleted vehicle {vehicle_id}",
        )

    def set_default(self, db: Session, user_id: int, vehicle_id: int) -> Vehicle:
        vehicle = self.get_vehicle_by_id(db, user_id, vehicle_id)
        vehicle_repo.unset_default_vehicles(db, user_id)
        vehicle.is_default = True
        db.commit()
        db.refresh(vehicle)
        return vehicle


vehicle_service = VehicleService()
