import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.facility import ParkingFacility, FacilityStatus
from app.models.spot import ParkingSpot, SpotType, SpotStatus
from app.models.occupancy import FacilityOccupancySnapshot
from datetime import time, datetime

def seed_mumbai_facilities():
    db = SessionLocal()
    try:
        print("[*] Seeding database with Mumbai parking facilities...")

        # 1. Ensure Operator exists
        operator = db.query(User).filter(User.email == "mumbai_operator@smartparking.io").first()
        if not operator:
            operator = User(
                email="mumbai_operator@smartparking.io",
                hashed_password=get_password_hash("Operator@123"),
                full_name="Mumbai Municipal Parking Operator",
                role=UserRole.OPERATOR,
                is_active=True,
                is_verified=True,
                phone_number="+91 8888888888",
                auth_provider="local",
            )
            db.add(operator)
            db.commit()
            db.refresh(operator)
        
        mumbai_locations = [
            {"name": "Bandra Kurla Complex (BKC) Parking", "address": "G Block, BKC, Bandra East", "lat": 19.0655, "lng": 72.8643, "cap": 100},
            {"name": "Colaba Causeway Premium Parking", "address": "Shahid Bhagat Singh Rd, Colaba", "lat": 18.9171, "lng": 72.8277, "cap": 40},
            {"name": "Nariman Point Hub", "address": "Jamnalal Bajaj Marg, Nariman Point", "lat": 18.9260, "lng": 72.8231, "cap": 150},
            {"name": "Andheri East Metro Parking", "address": "Andheri Kurla Road", "lat": 19.1136, "lng": 72.8697, "cap": 80},
            {"name": "Dadar West Railway Station Parking", "address": "Senapati Bapat Marg, Dadar West", "lat": 19.0193, "lng": 72.8427, "cap": 60},
            {"name": "Powai Hiranandani Gardens", "address": "Central Ave, Hiranandani, Powai", "lat": 19.1197, "lng": 72.9091, "cap": 90},
            {"name": "Goregaon NESCO Center", "address": "Western Express Hwy, Goregaon East", "lat": 19.1524, "lng": 72.8540, "cap": 250},
            {"name": "Lower Parel Phoenix Mall", "address": "Senapati Bapat Marg, Lower Parel", "lat": 18.9940, "lng": 72.8252, "cap": 200},
            {"name": "Juhu Beach Public Parking", "address": "Juhu Tara Rd", "lat": 19.0988, "lng": 72.8267, "cap": 50},
            {"name": "Worli Sea Face Premium", "address": "Khan Abdul Gaffar Khan Road, Worli", "lat": 19.0163, "lng": 72.8166, "cap": 45}
        ]

        facilities = []
        for loc in mumbai_locations:
            fac = ParkingFacility(
                name=loc["name"],
                address=loc["address"],
                latitude=loc["lat"],
                longitude=loc["lng"],
                total_capacity=loc["cap"],
                available_capacity=loc["cap"],
                price_per_hour=50.0,
                operator_id=operator.id,
                opening_time=time(6, 0),
                closing_time=time(23, 0),
                status=FacilityStatus.OPEN
            )
            db.add(fac)
            facilities.append(fac)
        
        db.commit()

        # Generate Spots and Snapshots
        for fac in facilities:
            db.refresh(fac)
            spots = []
            for i in range(fac.total_capacity):
                spots.append(ParkingSpot(
                    facility_id=fac.id,
                    spot_number=f"S-{i+1}",
                    floor="Ground",
                    spot_type=SpotType.STANDARD,
                    status=SpotStatus.AVAILABLE
                ))
            db.add_all(spots)

            # Snapshots
            snap = FacilityOccupancySnapshot(
                facility_id=fac.id,
                recorded_at=datetime.utcnow(),
                total_spots=fac.total_capacity,
                occupied_spots=0,
                occupancy_rate=0.0
            )
            db.add(snap)
            
        db.commit()
        print("[SUCCESS] Seeded Mumbai facilities, spots, and snapshots.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_mumbai_facilities()
