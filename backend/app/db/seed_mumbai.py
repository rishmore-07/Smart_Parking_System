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
            {
                "name": "Bandra Kurla Complex (BKC) Smart Parking",
                "description": "Premium multi-level automated parking located in central BKC financial district with fast EV chargers.",
                "address": "G Block, BKC, Bandra East, Mumbai, Maharashtra 400051",
                "lat": 19.0655,
                "lng": 72.8643,
                "cap": 120,
                "avail": 54,
                "price": 60.0,
                "rating": 4.8,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(0, 0),
                "close": time(23, 59),
            },
            {
                "name": "BKC Diamond Bourse Parking",
                "description": "Secure covered parking adjacent to Bharat Diamond Bourse with round-the-clock surveillance.",
                "address": "Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051",
                "lat": 19.0618,
                "lng": 72.8601,
                "cap": 180,
                "avail": 22,
                "price": 70.0,
                "rating": 4.6,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(6, 0),
                "close": time(23, 30),
            },
            {
                "name": "Colaba Causeway Heritage Parking",
                "description": "Centrally located open and covered facility convenient for South Mumbai tourists and shoppers.",
                "address": "Shahid Bhagat Singh Rd, Colaba, Mumbai, Maharashtra 400005",
                "lat": 18.9171,
                "lng": 72.8277,
                "cap": 50,
                "avail": 8,
                "price": 80.0,
                "rating": 4.2,
                "security": True,
                "ev": False,
                "accessible": True,
                "open": time(7, 0),
                "close": time(23, 0),
            },
            {
                "name": "Nariman Point Business District Hub",
                "description": "Prime underground parking facility near Marine Drive and corporate headquarters.",
                "address": "Jamnalal Bajaj Marg, Nariman Point, Mumbai, Maharashtra 400021",
                "lat": 18.9260,
                "lng": 72.8231,
                "cap": 160,
                "avail": 92,
                "price": 90.0,
                "rating": 4.7,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(5, 30),
                "close": time(23, 30),
            },
            {
                "name": "Lower Parel Phoenix Palladium Parking",
                "description": "Large multi-tier parking connected directly to Palladium and High Street Phoenix retail avenues.",
                "address": "Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013",
                "lat": 18.9940,
                "lng": 72.8252,
                "cap": 250,
                "avail": 140,
                "price": 75.0,
                "rating": 4.5,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(9, 0),
                "close": time(23, 59),
            },
            {
                "name": "Dadar Flower Market & Station Parking",
                "description": "High-turnover transit parking located within 200m of Dadar Western & Central terminals.",
                "address": "Senapati Bapat Marg, Dadar West, Mumbai, Maharashtra 400028",
                "lat": 19.0193,
                "lng": 72.8427,
                "cap": 80,
                "avail": 12,
                "price": 40.0,
                "rating": 3.9,
                "security": True,
                "ev": False,
                "accessible": False,
                "open": time(4, 0),
                "close": time(23, 0),
            },
            {
                "name": "Worli Sea Face Premium Promenade Parking",
                "description": "Scenic parking spot right beside the Worli coastline and Sea Link entry point.",
                "address": "Khan Abdul Gaffar Khan Road, Worli, Mumbai, Maharashtra 400030",
                "lat": 19.0163,
                "lng": 72.8166,
                "cap": 60,
                "avail": 36,
                "price": 50.0,
                "rating": 4.4,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(6, 0),
                "close": time(22, 0),
            },
            {
                "name": "Andheri East Metro Station Parking",
                "description": "Seamless multi-modal commuter parking beside Andheri Line 1 Metro & suburban station.",
                "address": "Andheri Kurla Road, Andheri East, Mumbai, Maharashtra 400069",
                "lat": 19.1136,
                "lng": 72.8697,
                "cap": 110,
                "avail": 15,
                "price": 35.0,
                "rating": 4.1,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(5, 0),
                "close": time(23, 59),
            },
            {
                "name": "Andheri West Lokhandwala Market Parking",
                "description": "Convenient street-level parking lot for shoppers in Lokhandwala complex.",
                "address": "Lokhandwala Complex Rd, Andheri West, Mumbai, Maharashtra 400053",
                "lat": 19.1415,
                "lng": 72.8276,
                "cap": 45,
                "avail": 5,
                "price": 45.0,
                "rating": 4.0,
                "security": True,
                "ev": False,
                "accessible": False,
                "open": time(8, 0),
                "close": time(23, 0),
            },
            {
                "name": "Juhu Beach Municipal Parking",
                "description": "Spacious public ground near Juhu Chowpatty with dedicated beachgoer access.",
                "address": "Juhu Tara Rd, Juhu, Mumbai, Maharashtra 400049",
                "lat": 19.0988,
                "lng": 72.8267,
                "cap": 90,
                "avail": 48,
                "price": 40.0,
                "rating": 4.3,
                "security": True,
                "ev": False,
                "accessible": True,
                "open": time(6, 0),
                "close": time(23, 0),
            },
            {
                "name": "Bandra West Linking Road Shoppers Parking",
                "description": "Prime shopping area parking near Linking Road fashion hubs and cafes.",
                "address": "Linking Road, Bandra West, Mumbai, Maharashtra 400050",
                "lat": 19.0596,
                "lng": 72.8335,
                "cap": 70,
                "avail": 18,
                "price": 60.0,
                "rating": 4.3,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(9, 0),
                "close": time(23, 0),
            },
            {
                "name": "Bandra Bandstand Sea View Parking",
                "description": "Open-air scenic bayside parking near Bandra Fort and Joggers Park.",
                "address": "Bandstand Promenade, Bandra West, Mumbai, Maharashtra 400050",
                "lat": 19.0436,
                "lng": 72.8193,
                "cap": 40,
                "avail": 21,
                "price": 50.0,
                "rating": 4.6,
                "security": True,
                "ev": False,
                "accessible": True,
                "open": time(6, 0),
                "close": time(22, 0),
            },
            {
                "name": "Powai Hiranandani Gardens Tech Hub",
                "description": "Modern multi-storey facility in Powai near commercial parks and lakeside restaurants.",
                "address": "Central Ave, Hiranandani, Powai, Mumbai, Maharashtra 400076",
                "lat": 19.1197,
                "lng": 72.9091,
                "cap": 130,
                "avail": 78,
                "price": 45.0,
                "rating": 4.7,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(0, 0),
                "close": time(23, 59),
            },
            {
                "name": "Goregaon NESCO Exhibition Parking",
                "description": "Massive exhibition center surface parking right off the Western Express Highway.",
                "address": "Western Express Hwy, Goregaon East, Mumbai, Maharashtra 400063",
                "lat": 19.1524,
                "lng": 72.8540,
                "cap": 300,
                "avail": 195,
                "price": 50.0,
                "rating": 4.4,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(6, 0),
                "close": time(23, 0),
            },
            {
                "name": "Kurla Phoenix Marketcity Parking",
                "description": "Sprawling multi-level underground parking with state-of-the-art guidance systems.",
                "address": "LBS Marg, Kurla West, Mumbai, Maharashtra 400070",
                "lat": 19.0863,
                "lng": 72.8890,
                "cap": 220,
                "avail": 110,
                "price": 55.0,
                "rating": 4.5,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(10, 0),
                "close": time(23, 30),
            },
            {
                "name": "Chhatrapati Shivaji Maharaj Terminus (CSMT) Parking",
                "description": "Heritage terminal vicinity parking supporting suburban commuters and tourists.",
                "address": "DN Road, Fort, Mumbai, Maharashtra 400001",
                "lat": 18.9402,
                "lng": 72.8356,
                "cap": 95,
                "avail": 14,
                "price": 60.0,
                "rating": 4.0,
                "security": True,
                "ev": False,
                "accessible": True,
                "open": time(5, 0),
                "close": time(23, 59),
            },
            {
                "name": "Malad Inorbit Mall & Mindspace Parking",
                "description": "High-capacity smart parking serving IT tech parks and retail shoppers.",
                "address": "Link Road, Malad West, Mumbai, Maharashtra 400064",
                "lat": 19.1764,
                "lng": 72.8347,
                "cap": 170,
                "avail": 85,
                "price": 50.0,
                "rating": 4.3,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(8, 0),
                "close": time(23, 30),
            },
            {
                "name": "Vashi Sector 17 Commercial Parking",
                "description": "Convenient Navi Mumbai transit parking near APMC and railway node.",
                "address": "Sector 17, Vashi, Navi Mumbai, Maharashtra 400703",
                "lat": 19.0760,
                "lng": 72.9986,
                "cap": 100,
                "avail": 62,
                "price": 30.0,
                "rating": 4.2,
                "security": True,
                "ev": False,
                "accessible": True,
                "open": time(7, 0),
                "close": time(22, 30),
            },
            {
                "name": "Thane Viviana Mall Smart Parking",
                "description": "Multi-tier covered parking with fast charging bays located along the Eastern Express Highway.",
                "address": "Eastern Express Hwy, Thane West, Maharashtra 400606",
                "lat": 19.2084,
                "lng": 72.9719,
                "cap": 210,
                "avail": 125,
                "price": 40.0,
                "rating": 4.6,
                "security": True,
                "ev": True,
                "accessible": True,
                "open": time(8, 30),
                "close": time(23, 30),
            },
            {
                "name": "Chembur Diamond Garden Public Parking",
                "description": "Affordable neighborhood parking facility next to the Monorail and Sion-Panvel Highway.",
                "address": "Central Ave, Chembur, Mumbai, Maharashtra 400071",
                "lat": 19.0522,
                "lng": 72.8995,
                "cap": 65,
                "avail": 31,
                "price": 35.0,
                "rating": 4.1,
                "security": True,
                "ev": True,
                "accessible": False,
                "open": time(6, 0),
                "close": time(22, 0),
            },
        ]

        facilities = []
        for loc in mumbai_locations:
            # Check if facility already exists
            existing = db.query(ParkingFacility).filter(ParkingFacility.name == loc["name"]).first()
            if existing:
                continue

            fac = ParkingFacility(
                name=loc["name"],
                description=loc["description"],
                address=loc["address"],
                latitude=loc["lat"],
                longitude=loc["lng"],
                total_capacity=loc["cap"],
                available_capacity=loc["avail"],
                price_per_hour=loc["price"],
                rating=loc["rating"],
                security_available=loc["security"],
                ev_charging_available=loc["ev"],
                accessible_parking=loc["accessible"],
                operator_id=operator.id,
                opening_time=loc["open"],
                closing_time=loc["close"],
                status=FacilityStatus.OPEN,
            )
            db.add(fac)
            facilities.append(fac)

        db.commit()

        # Generate realistic spots and snapshots for newly seeded facilities
        for fac in facilities:
            db.refresh(fac)
            spots = []
            ev_count = int(fac.total_capacity * 0.15) if fac.ev_charging_available else 0
            acc_count = int(fac.total_capacity * 0.08) if fac.accessible_parking else 0

            for i in range(fac.total_capacity):
                if i < ev_count:
                    stype = SpotType.EV
                elif i < ev_count + acc_count:
                    stype = SpotType.HANDICAPPED
                else:
                    stype = SpotType.STANDARD

                # Status matches simulated occupied count
                is_occupied = i >= fac.available_capacity
                sstatus = SpotStatus.OCCUPIED if is_occupied else SpotStatus.AVAILABLE

                floor_name = f"Floor {i // 30 + 1}" if fac.total_capacity > 60 else "Ground"
                spots.append(
                    ParkingSpot(
                        facility_id=fac.id,
                        spot_number=f"P{fac.id}-{i+1:03d}",
                        floor=floor_name,
                        spot_type=stype,
                        status=sstatus,
                        is_active=True,
                    )
                )
            db.add_all(spots)

            # Generate snapshots for simulated availability
            occupied_count = fac.total_capacity - fac.available_capacity
            occ_rate = round((occupied_count / fac.total_capacity) * 100.0, 1)
            snap = FacilityOccupancySnapshot(
                facility_id=fac.id,
                recorded_at=datetime.utcnow(),
                total_spots=fac.total_capacity,
                occupied_spots=occupied_count,
                occupancy_rate=occ_rate,
            )
            db.add(snap)

        db.commit()
        print(f"[SUCCESS] Seeded {len(facilities)} Mumbai facilities, spots, and snapshots.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_mumbai_facilities()

