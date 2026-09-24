# Smart Parking Finder — Software Architecture & Specification

## 1. System Overview
**Smart Parking Finder** is an intelligent smart-city mobility platform engineered to streamline parking discovery, reservations, payments, occupancy simulation, and vehicle recovery for drivers, parking operators, and municipal administrators.

---

## 2. Technology Stack
- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic V2, PyJWT, Bcrypt
- **Database**: PostgreSQL / SQLite (with dynamic driver switching)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, TanStack Query, Lucide Icons, Framer Motion
- **AI Core**: scikit-learn, XGBoost, pandas, joblib
- **Third-Party Integrations**: Razorpay (Test Mode), Google OAuth, Google Maps Platform, OpenWeatherMap

---

## 3. User Roles & RBAC Matrix
1. **Guest**: Search parking, browse interactive map, view simulated availability.
2. **Registered Driver (`driver`)**: Vehicle garage management, spot booking, digital test payments, parked vehicle locator, reviews.
3. **Parking Operator (`operator`)**: Manage parking facility, spot inventory, tariff modification, booking logs, occupancy analytics.
4. **Administrator (`admin`)**: User & operator moderation, community incident oversight, platform analytics, system audit compliance.

---

## 4. Entity-Relationship Design (14 Core Entities)
1. **User**: Authentication, role assignment, profile, contact information.
2. **Vehicle**: Registered vehicles with type classification (Car, SUV, Bike, EV) and default vehicle flag.
3. **ParkingFacility**: Geospatial coordinates, spot capacity, pricing tariff, amenities (EV, accessibility, CCTV).
4. **ParkingSpot**: Individual spot numbers, floor/zone, status (Available, Occupied, Reserved, Maintenance).
5. **FacilityOccupancySnapshot**: Time-series historical snapshot of occupancy rates for AI availability modeling.
6. **Reservation**: Double-booking safe spot reservation with booking code, check-in/out timestamps, and lifecycle status.
7. **Payment**: Digital payment transactions linking to Razorpay order & verification hashes.
8. **Receipt**: Generated billing receipts with breakdown and unique serial numbers.
9. **ParkingSession**: Active parking sessions with saved vehicle location coordinates for vehicle retrieval.
10. **Review**: Facility user ratings and feedback.
11. **CommunityReport**: User reports on spot blockages, incorrect occupancy, or equipment failure with admin resolution workflows.
12. **Favourite**: Saved driver parking locations for quick 1-tap navigation.
13. **Notification**: User alerts for booking confirmation, parking expiry warnings, and community updates.
14. **AuditLog**: Immutable system audit tracking for all critical operations.

---

## 5. Development Phase Roadmap
- **Phase 1 (Complete)**: Architecture foundation, full database models, Alembic migrations, JWT authentication & RBAC, vehicle profile garage, and base UI.
- **Phase 2 (Upcoming)**: Interactive Map & Search Engine, Geospatial discovery, simulated occupancy engine, filters (EV, price, distance).
- **Phase 3 (Upcoming)**: Spot reservation lifecycle, double-booking prevention locks, Razorpay test payment flow, receipt generation, vehicle locator.
- **Phase 4 (Upcoming)**: AI availability prediction & ranking, Community reports, Operator facility dashboard & Admin analytics portal.
