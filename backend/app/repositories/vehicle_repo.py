from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.base_repo import BaseRepository
from app.models.vehicle import Vehicle


class VehicleRepository(BaseRepository[Vehicle]):
    def __init__(self):
        super().__init__(Vehicle)

    def get_by_user_id(self, db: Session, user_id: int) -> List[Vehicle]:
        return db.query(Vehicle).filter(Vehicle.user_id == user_id).order_by(Vehicle.is_default.desc(), Vehicle.created_at.desc()).all()

    def get_by_user_and_id(self, db: Session, user_id: int, vehicle_id: int) -> Optional[Vehicle]:
        return db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.user_id == user_id).first()

    def get_default_vehicle(self, db: Session, user_id: int) -> Optional[Vehicle]:
        return db.query(Vehicle).filter(Vehicle.user_id == user_id, Vehicle.is_default == True).first()

    def unset_default_vehicles(self, db: Session, user_id: int) -> None:
        db.query(Vehicle).filter(Vehicle.user_id == user_id).update({Vehicle.is_default: False})
        db.commit()


vehicle_repo = VehicleRepository()
