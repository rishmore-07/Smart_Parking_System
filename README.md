# Smart Parking Finder 🚗⚡
> **An Intelligent Parking Assistant for Smart Cities**

Smart Parking Finder is an end-to-end full-stack platform designed to eliminate urban parking congestion through real-time occupancy simulation, AI-driven availability forecasting, spot reservation locks, digital payments, and driver navigation.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic V2, PyJWT, Bcrypt
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, TanStack Query, Lucide Icons, Framer Motion
- **Database**: PostgreSQL / SQLite (via dynamic connection driver)
- **AI Core**: scikit-learn, XGBoost, pandas, joblib
- **Integrations**: Razorpay (Test Mode), Google OAuth, Google Maps Platform, OpenWeatherMap

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Start
```bash
# Navigate to backend
cd backend

# Virtual environment is already configured in backend/venv
# Run database migrations
venv\Scripts\alembic.exe upgrade head

# Seed initial test data (Admin, Operator, Driver + Vehicles)
venv\Scripts\python.exe app\db\seed.py

# Start FastAPI server (runs on http://127.0.0.1:8000)
venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```
Swagger UI documentation will be available at: **http://127.0.0.1:8000/docs**

### 2. Frontend Setup & Start
```bash
# Navigate to frontend
cd frontend

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

### 3. Run Backend Test Suite
```bash
cd backend
venv\Scripts\pytest.exe -v
```

---

## 👥 Seeded Test Accounts

| Role | Email | Password | Pre-seeded Resources |
|---|---|---|---|
| **Driver** | `driver@smartparking.io` | `Driver@123456` | Tesla Model 3 (Default, EV), Toyota RAV4 Hybrid |
| **Operator** | `operator@smartparking.io` | `Operator@123456` | Metro Park Operator profile |
| **Admin** | `admin@smartparking.io` | `Admin@123456` | Full system administration & audit rights |

*Note: The frontend Landing Page and Login Page also feature 1-click test login buttons for rapid role testing!*

---

## 📁 Project Directory Structure
```
smartParking/
├── backend/
│   ├── alembic/              # Database version migrations
│   ├── app/
│   │   ├── api/v1/           # API Endpoints (Auth, Users, Vehicles)
│   │   ├── core/             # Configuration, Database, Security, RBAC
│   │   ├── db/               # Seeding script
│   │   ├── models/           # 14 SQLAlchemy relational models
│   │   ├── repositories/     # Data access layer
│   │   ├── schemas/          # Pydantic V2 validation schemas
│   │   ├── services/         # Business logic layer
│   │   └── main.py           # FastAPI entrypoint
│   ├── tests/                # Automated pytest integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI & Layout components
│   │   ├── pages/            # Landing, Auth, Vehicles, Profile, 404
│   │   ├── services/         # API HTTP client & service methods
│   │   ├── stores/           # Zustand global state (Auth)
│   │   └── types/            # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── ai/                       # AI models & architecture specification
├── docs/                     # Comprehensive architecture documentation
└── scripts/                  # Convenience execution scripts (.bat)
```

---

## 📌 Development Phase Status
- [x] **Phase 1: Project Architecture Foundation, Database Models, Migrations, JWT Auth & RBAC, Vehicle Profiles, and Base UI**
- [ ] **Phase 2: Interactive Map, Search Engine & Real-time Simulated Occupancy**
- [ ] **Phase 3: Spot Reservations, Double-Booking Locks, Razorpay Payments & Receipts, Vehicle Finder**
- [ ] **Phase 4: AI Predictive Availability Engine, Operator Dashboard & Admin Portal**
