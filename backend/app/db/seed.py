import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleType


def seed_database():
    db = SessionLocal()
    try:
        print("[*] Seeding database with initial users and test data...")

        # 1. Admin
        admin = db.query(User).filter(User.email == "admin@smartparking.io").first()
        if not admin:
            admin = User(
                email="admin@smartparking.io",
                hashed_password=get_password_hash("Admin@123456"),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                auth_provider="local",
            )
            db.add(admin)
            print("  [+] Created Admin user: admin@smartparking.io")

        # 2. Operator
        operator = db.query(User).filter(User.email == "operator@smartparking.io").first()
        if not operator:
            operator = User(
                email="operator@smartparking.io",
                hashed_password=get_password_hash("Operator@123456"),
                full_name="Metro Park Operator",
                role=UserRole.OPERATOR,
                is_active=True,
                is_verified=True,
                phone_number="+91 9876543210",
                auth_provider="local",
            )
            db.add(operator)
            print("  [+] Created Operator user: operator@smartparking.io")

        # 3. Driver
        driver = db.query(User).filter(User.email == "driver@smartparking.io").first()
        if not driver:
            driver = User(
                email="driver@smartparking.io",
                hashed_password=get_password_hash("Driver@123456"),
                full_name="Alex Rivera",
                role=UserRole.DRIVER,
                is_active=True,
                is_verified=True,
                phone_number="+91 9123456780",
                auth_provider="local",
            )
            db.add(driver)
            db.commit()
            db.refresh(driver)
            print("  [+] Created Driver user: driver@smartparking.io")

            # Seed sample vehicles for driver
            v1 = Vehicle(
                user_id=driver.id,
                license_plate="MH-02-CB-1234",
                make="Tesla",
                model="Model 3",
                color="Midnight Silver",
                vehicle_type=VehicleType.EV,
                is_default=True,
            )
            v2 = Vehicle(
                user_id=driver.id,
                license_plate="MH-02-DE-5678",
                make="Toyota",
                model="RAV4 Hybrid",
                color="Pearl White",
                vehicle_type=VehicleType.SUV,
                is_default=False,
            )
            db.add_all([v1, v2])
            print("  [+] Seeded 2 vehicles for driver.")

        db.commit()
        print("[SUCCESS] Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
