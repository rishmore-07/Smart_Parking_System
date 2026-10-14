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

---

## 📅 Phase 4: Parking Reservation and Booking Management

### 1. Driver Booking Workflow
1. Browse parking facilities on the discovery map at `http://localhost:5174/parking`.
2. Click on any facility card to open its **Facility Details** view.
3. Click **Reserve Parking** to open the real-time booking gateway modal.
4. Select reservation date, start time, and end time.
5. Select a registered vehicle (or quickly add a new one).
6. Choose space allocation:
   - **Auto Assign**: Automatic allocation of best available standard, EV, or compact bay.
   - **Select Spot**: Interactive spot grid displaying real-time availability for the chosen time window.
7. Review the live server-calculated fee breakdown (duration, rate, billed hours, and estimated total).
8. Click **Confirm Booking** — spot capacity is locked with a unique human-readable booking reference (e.g. `SPF-20261014-9DF2B1`).
9. View your booking confirmation receipt and access your reservation history under **My Bookings** (`/bookings`).

### 2. Double-Booking Prevention & Concurrency
- **Server-Side Validation**: Backend independently recalculates durations, validates that times are in the future, and enforces facility operating hours.
- **Row-Level Locking**: Uses `SELECT ... FOR UPDATE` serialization during space assignment to prevent race conditions during concurrent booking requests.
- **Overlapping Check**: A reservation is considered conflicting if `start_time < existing.end_time AND end_time > existing.start_time` for active statuses (`CONFIRMED`, `ACTIVE`, `PENDING`).
- **Adjacent Reservations**: Permitted without artificial gap constraints.

### 3. Cancellation Policy
- Drivers can cancel any confirmed reservation **before the scheduled start time** (`now < start_time`).
- Cancellations after the start time or on completed bookings are rejected by the backend.
- When cancelled, the reservation status is set to `CANCELLED`, recording `cancelled_at` and `cancellation_reason`, immediately releasing the bay back into available inventory.

### 4. Operator & Admin Reservation Hub
- **Operators**: Access live reservations for facilities they own via the Profile Page or `/api/v1/operator/reservations`. Operators can mark reservations as `COMPLETED` or `NO_SHOW`.
- **Admins**: Platform-wide audit log of all bookings across all facilities with status and date filtering via `/api/v1/admin/reservations`.

### 5. API Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/reservations` | Create a confirmed reservation with locked spot | Yes (Bearer) |
| `POST` | `/api/v1/reservations/estimate` | Live server price calculation & availability | Yes (Bearer) |
| `GET` | `/api/v1/reservations/me` | List driver's reservations with status filters | Yes (Bearer) |
| `GET` | `/api/v1/reservations/{id}` | Get single reservation details (isolated to owner) | Yes (Bearer) |
| `POST` | `/api/v1/reservations/{id}/cancel` | Cancel an eligible reservation before start time | Yes (Bearer) |
| `GET` | `/api/v1/facilities/{id}/availability` | Facility-level capacity & availability tier | No |
| `GET` | `/api/v1/facilities/{id}/spaces/availability` | Spot-by-spot availability for a time window | No |
| `GET` | `/api/v1/operator/reservations` | List reservations for facilities owned by operator | Yes (Operator) |
| `PATCH` | `/api/v1/operator/reservations/{id}/status` | Mark reservation as `COMPLETED` or `NO_SHOW` | Yes (Operator) |
| `GET` | `/api/v1/admin/reservations` | Global platform reservation audit | Yes (Admin) |

---

## 💳 Phase 5: Digital Payment Gateway Integration — Razorpay

### 1. Razorpay Payment Architecture
- **Server-Authoritative Pricing**: Total amounts are strictly retrieved from the database reservation record and converted to paise (`int(round(amount * 100))`). Client prices are never trusted.
- **HMAC SHA256 Signature Verification**: Payment callbacks are strictly verified server-side using constant-time comparison `hmac.compare_digest` with `RAZORPAY_KEY_SECRET`.
- **Digital Receipt Generation**: A verified successful payment generates a digital `Receipt` record with a unique receipt number (e.g. `RCP-SPF-...`), itemized subtotal, zero hidden fees, and timestamp.
- **Idempotency**: Repeated callbacks or verification requests safely return the existing payment and receipt without creating duplicate transactions or receipts.
- **Webhook Integration**: `POST /api/v1/webhooks/razorpay` verifies `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET` and handles `payment.captured` and `payment.failed` events.

### 2. Razorpay API Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/reservations/{id}/payment/order` | Create server-verified Razorpay order for booking | Yes (Bearer) |
| `POST` | `/api/v1/payments/verify` | Verify Razorpay payment signature & generate receipt | Yes (Bearer) |
| `GET` | `/api/v1/reservations/{id}/payment` | Get payment status for a reservation | Yes (Bearer) |
| `GET` | `/api/v1/reservations/{id}/receipt` | Retrieve official payment receipt | Yes (Bearer) |
| `GET` | `/api/v1/payments/me` | List authenticated driver's payment history | Yes (Bearer) |
| `POST` | `/api/v1/webhooks/razorpay` | Process Razorpay webhook notifications | No (Signature Verified) |

### 3. Razorpay Test-Mode Configuration
Add your Razorpay test credentials to your `.env` file (or backend environment):
```env
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
RAZORPAY_MODE=test
```
> **Obtaining Test Keys**: Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com), navigate to **Settings > API Keys**, and generate test mode keys.

### 4. Running Payment Automated Tests
```bash
docker compose exec backend pytest -v tests/test_payments.py
```

---

## 📌 Development Phase Status
- [x] **Phase 0 & 1: Architecture, Database Models, Relational Schemas, Migrations, Docker Containerization**
- [x] **Phase 2: Authentication & User Profiles, JWT Security, RBAC Enforcement, Vehicle Management**
- [x] **Phase 3: Interactive Map, Facility Discovery, Distance Calculation, Mumbai Facilities Dataset**
- [x] **Phase 4: Parking Reservation & Booking Management, Double-Booking Prevention, Driver & Operator Hub**
- [x] **Phase 5: Digital Payment Gateway Integration (Razorpay), Order Creation, Signature Verification & Receipts**
- [ ] **Phase 6: AI Predictive Occupancy Engine**

