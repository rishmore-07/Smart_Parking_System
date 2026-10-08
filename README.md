# Smart Parking Finder 🚗⚡
> **An Intelligent Parking Assistant for Smart Cities**

Smart Parking Finder is an end-to-end full-stack platform designed to eliminate urban parking congestion through real-time occupancy simulation, AI-driven availability forecasting, spot reservation locks, digital payments, and driver navigation.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic V2, PyJWT, Bcrypt
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, TanStack Query, Lucide Icons, Framer Motion
- **Database**: PostgreSQL 16 (Dockerized) / SQLite fallback
- **Containerization**: Docker & Docker Compose
- **Security & RBAC**: Bcrypt salted hashes, HS256 JWT tokens, Role-Based Access Control (`driver`, `operator`, `admin`)

---

## 🔐 Phase 2: Authentication & User Profiles Architecture

### Role-Based Access Control (RBAC) Rules
- **DRIVER**: Default role assigned to all new public registrations. Access to vehicle garage, reservations, and profile.
- **OPERATOR**: Provisioned solely through controlled administrator process (`PUT /api/v1/users/{id}/role`). Access to facility management and occupancy controls.
- **ADMIN**: Platform administrator. Provisioned through database seeding or controlled administrative delegation.

### Authentication & Vehicle API Endpoints
All endpoints are available under both `/api/v1/` and `/api/`:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new driver account (forces `driver` role) | No |
| `POST` | `/api/v1/auth/login` | Authenticate email & password, returns JWT token | No |
| `POST` | `/api/v1/auth/logout` | Invalidate session / record logout audit trail | Yes (Bearer) |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Yes (Bearer) |
| `GET` | `/api/v1/users/me` | Retrieve current user profile details | Yes (Bearer) |
| `PUT` | `/api/v1/users/me` | Update user profile (full name, phone) | Yes (Bearer) |
| `POST` | `/api/v1/users/me/change-password` | Change account password | Yes (Bearer) |
| `GET` | `/api/v1/users/` | List all registered users (Admin only) | Yes (Admin) |
| `PUT` | `/api/v1/users/{id}/role` | Controlled role provisioning (Admin only) | Yes (Admin) |
| `POST` | `/api/v1/vehicles/` | Register new vehicle (checks duplicate plate) | Yes (Bearer) |
| `GET` | `/api/v1/vehicles/` | List all vehicles owned by current user | Yes (Bearer) |
| `GET` | `/api/v1/vehicles/{id}` | Get vehicle details (isolated to owner) | Yes (Bearer) |
| `PUT` / `PATCH` | `/api/v1/vehicles/{id}` | Update vehicle details | Yes (Bearer) |
| `DELETE` | `/api/v1/vehicles/{id}` | Delete vehicle from garage | Yes (Bearer) |
| `PUT` / `PATCH` | `/api/v1/vehicles/{id}/default` | Set vehicle as user's primary/default | Yes (Bearer) |

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env` or Docker Compose)
```env
PROJECT_NAME="Smart Parking Finder"
VERSION="1.0.0"
API_V1_STR="/api/v1"
ENVIRONMENT="development"
JWT_SECRET_KEY="smart_parking_super_secret_jwt_key_2026_change_in_production"
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days
DATABASE_URL="postgresql+psycopg2://parking_user:parking_password@postgres:5432/smart_parking"
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:5174","http://127.0.0.1:5174","http://127.0.0.1:5173"]
```

### Frontend Configuration (`frontend/.env` or Docker Compose)
```env
VITE_API_BASE_URL="http://localhost:8001/api/v1"
```

---

## 🚀 Running via Docker Compose

### 1. Start Services
```bash
docker compose up -d --build
```
Current host port mapping:
- **Frontend UI**: `http://localhost:5174`
- **FastAPI Backend**: `http://localhost:8001` (Docs at `http://localhost:8001/docs`)
- **PostgreSQL Database**: `localhost:5433` (internal `postgres:5432`)

### 2. Check Service Health & Logs
```bash
docker compose ps
docker compose logs -f backend
```

### 3. Apply Alembic Migrations
```bash
docker compose exec backend alembic upgrade head
```

### 4. Run Automated Backend Pytest Suite
```bash
docker compose exec backend pytest -v
```

---

## 🧪 Testing Registration & Login

### Via Frontend UI (`http://localhost:5174`)
1. Open browser at `http://localhost:5174`.
2. Click **Get Started** or **Register** in the navigation bar.
3. Fill in Full Name, Email, Password, Confirm Password, and accept Terms of Service.
4. Click **Create Account** — you will be automatically authenticated as a **Driver** and redirected to **Vehicle Garage** (`/vehicles`).
5. In **Vehicle Garage**, click **Add Vehicle** to register your vehicle (e.g., plate `MH-02-AB-1234`, make `Hyundai`, model `Ioniq 5`).
6. Click **Edit** (pencil icon) to modify details or **Make Default** to switch default vehicle.
7. Click **Sign Out** or navigate to **Profile** (`/profile`) to review role details and settings.
8. To test existing accounts, use the quick fill options on the Login page (`/login`):
   - **Driver**: `driver@smartparking.io` / `Driver@123456`
   - **Operator**: `operator@smartparking.io` / `Operator@123456`
   - **Admin**: `admin@smartparking.io` / `Admin@123456`

---

## 📌 Development Phase Status
- [x] **Phase 0 & 1: Architecture, Database Models, Relational Schemas, Migrations, Docker Containerization**
- [x] **Phase 2: Authentication & User Profiles, JWT Security, RBAC Enforcement, Vehicle Management, Polished UI**
- [ ] **Phase 3: Interactive Map, Facility Discovery, Spot Reservations, Razorpay Payments**
- [ ] **Phase 4: AI Predictive Occupancy Engine, Operator Dashboard, Admin Portal**
