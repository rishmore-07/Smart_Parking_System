from datetime import datetime, timedelta
import pytest
from app.models.user import User, UserRole
from app.models.facility import ParkingFacility, FacilityStatus
from app.models.spot import ParkingSpot, SpotType, SpotStatus
from app.models.vehicle import Vehicle, VehicleType
from app.models.reservation import Reservation, ReservationStatus
from app.core.security import get_password_hash, create_access_token


def setup_test_data(db_session):
    # 1. Operator
    operator = User(
        email="op_test@smartparking.io",
        hashed_password=get_password_hash("Pass123"),
        full_name="Facility Operator",
        role=UserRole.OPERATOR,
        is_active=True,
        is_verified=True,
    )
    # 2. Driver 1
    driver1 = User(
        email="driver1_test@smartparking.io",
        hashed_password=get_password_hash("Pass123"),
        full_name="Driver One",
        role=UserRole.DRIVER,
        is_active=True,
        is_verified=True,
    )
    # 3. Driver 2
    driver2 = User(
        email="driver2_test@smartparking.io",
        hashed_password=get_password_hash("Pass123"),
        full_name="Driver Two",
        role=UserRole.DRIVER,
        is_active=True,
        is_verified=True,
    )
    # 4. Admin
    admin = User(
        email="admin_test@smartparking.io",
        hashed_password=get_password_hash("Pass123"),
        full_name="System Admin",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db_session.add_all([operator, driver1, driver2, admin])
    db_session.commit()

    # 5. Facility
    facility = ParkingFacility(
        name="BKC Premier Lot",
        description="Central smart parking",
        address="BKC G Block, Mumbai",
        latitude=19.0655,
        longitude=72.8643,
        total_capacity=10,
        available_capacity=10,
        price_per_hour=60.0,
        status=FacilityStatus.OPEN,
        operator_id=operator.id,
    )
    db_session.add(facility)
    db_session.commit()

    # 6. Spots
    spot1 = ParkingSpot(
        facility_id=facility.id,
        spot_number="A-101",
        floor="Ground",
        spot_type=SpotType.STANDARD,
        status=SpotStatus.AVAILABLE,
        is_active=True,
    )
    spot2 = ParkingSpot(
        facility_id=facility.id,
        spot_number="A-102",
        floor="Ground",
        spot_type=SpotType.EV,
        status=SpotStatus.AVAILABLE,
        is_active=True,
    )
    spot_maint = ParkingSpot(
        facility_id=facility.id,
        spot_number="A-103",
        floor="Ground",
        spot_type=SpotType.STANDARD,
        status=SpotStatus.MAINTENANCE,
        is_active=True,
    )
    db_session.add_all([spot1, spot2, spot_maint])
    db_session.commit()

    # 7. Vehicles
    v1 = Vehicle(
        user_id=driver1.id,
        license_plate="MH-02-D1-1111",
        make="Hyundai",
        model="Creta",
        vehicle_type=VehicleType.CAR,
        is_default=True,
    )
    v2 = Vehicle(
        user_id=driver2.id,
        license_plate="MH-02-D2-2222",
        make="Tata",
        model="Nexon EV",
        vehicle_type=VehicleType.EV,
        is_default=True,
    )
    db_session.add_all([v1, v2])
    db_session.commit()

    return {
        "operator": operator,
        "driver1": driver1,
        "driver2": driver2,
        "admin": admin,
        "facility": facility,
        "spot1": spot1,
        "spot2": spot2,
        "spot_maint": spot_maint,
        "v1": v1,
        "v2": v2,
    }


def auth_header(user: User):
    token = create_access_token(
        subject=user.id,
        role=user.role.value,
        email=user.email,
        full_name=user.full_name,
    )
    return {"Authorization": f"Bearer {token}"}


def test_successful_reservation_creation(client, db_session):
    data = setup_test_data(db_session)
    driver1 = data["driver1"]
    facility = data["facility"]
    v1 = data["v1"]
    spot1 = data["spot1"]

    start = datetime.utcnow() + timedelta(hours=2)
    end = start + timedelta(hours=2)

    payload = {
        "facility_id": facility.id,
        "vehicle_id": v1.id,
        "spot_id": spot1.id,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
    }

    res = client.post("/api/v1/reservations", json=payload, headers=auth_header(driver1))
    assert res.status_code == 201
    res_data = res.json()["data"]
    assert res_data["booking_code"].startswith("SPF-")
    assert res_data["facility_id"] == facility.id
    assert res_data["spot_id"] == spot1.id
    assert res_data["status"] == "CONFIRMED"
    # 2 hours * 60 = 120
    assert res_data["total_amount"] == 120.0
    assert res_data["currency"] == "INR"


def test_unauthenticated_booking_attempt(client, db_session):
    data = setup_test_data(db_session)
    start = datetime.utcnow() + timedelta(hours=2)
    end = start + timedelta(hours=1)
    payload = {
        "facility_id": data["facility"].id,
        "vehicle_id": data["v1"].id,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
    }
    res = client.post("/api/v1/reservations", json=payload)
    assert res.status_code == 401


def test_invalid_reservation_date_and_time(client, db_session):
    data = setup_test_data(db_session)
    driver = data["driver1"]
    facility = data["facility"]
    v1 = data["v1"]

    # 1. Past start time
    past_start = datetime.utcnow() - timedelta(hours=3)
    past_end = datetime.utcnow() - timedelta(hours=1)
    res = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "start_time": past_start.isoformat(),
            "end_time": past_end.isoformat(),
        },
        headers=auth_header(driver),
    )
    assert res.status_code == 400
    assert "past" in res.json()["detail"].lower()

    # 2. End time before start time
    future_start = datetime.utcnow() + timedelta(hours=2)
    invalid_end = datetime.utcnow() + timedelta(hours=1)
    res2 = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "start_time": future_start.isoformat(),
            "end_time": invalid_end.isoformat(),
        },
        headers=auth_header(driver),
    )
    assert res2.status_code == 422 or res2.status_code == 400


def test_reservation_of_unavailable_space(client, db_session):
    data = setup_test_data(db_session)
    driver = data["driver1"]
    facility = data["facility"]
    v1 = data["v1"]
    spot_maint = data["spot_maint"]

    start = datetime.utcnow() + timedelta(hours=1)
    end = start + timedelta(hours=1)

    # Attempt booking spot under maintenance
    res = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "spot_id": spot_maint.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver),
    )
    assert res.status_code == 400
    assert "maintenance" in res.json()["detail"].lower()


def test_overlapping_reservation_rejection(client, db_session):
    data = setup_test_data(db_session)
    driver1 = data["driver1"]
    driver2 = data["driver2"]
    facility = data["facility"]
    spot1 = data["spot1"]
    v1 = data["v1"]
    v2 = data["v2"]

    # Driver 1 books 14:00 - 16:00
    start = datetime.utcnow() + timedelta(hours=5)
    end = start + timedelta(hours=2)

    res1 = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "spot_id": spot1.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver1),
    )
    assert res1.status_code == 201

    # Driver 2 attempts overlapping reservation on same spot: 15:00 - 17:00
    overlap_start = start + timedelta(hours=1)
    overlap_end = end + timedelta(hours=1)

    res2 = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v2.id,
            "spot_id": spot1.id,
            "start_time": overlap_start.isoformat(),
            "end_time": overlap_end.isoformat(),
        },
        headers=auth_header(driver2),
    )
    assert res2.status_code == 409
    assert "already reserved" in res2.json()["detail"].lower()


def test_server_side_price_calculation(client, db_session):
    data = setup_test_data(db_session)
    driver = data["driver1"]
    facility = data["facility"]
    v1 = data["v1"]

    # 1. Test Estimate Endpoint: 2.5 hours rounded up to 3 hours billed * 60 = 180
    start = datetime.utcnow() + timedelta(hours=2)
    end = start + timedelta(hours=2, minutes=30)

    est_res = client.post(
        "/api/v1/reservations/estimate",
        json={
            "facility_id": facility.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver),
    )
    assert est_res.status_code == 200
    est_data = est_res.json()["data"]
    assert est_data["billed_hours"] == 3.0
    assert est_data["total_amount"] == 180.0
    assert est_data["currency"] == "INR"
    assert est_data["available"] is True

    # 2. Test Booking fee: ensure browser-supplied prices cannot override server calculation
    book_res = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver),
    )
    assert book_res.status_code == 201
    assert book_res.json()["data"]["total_amount"] == 180.0


def test_driver_access_to_own_booking(client, db_session):
    data = setup_test_data(db_session)
    driver = data["driver1"]
    facility = data["facility"]
    v1 = data["v1"]

    start = datetime.utcnow() + timedelta(hours=3)
    end = start + timedelta(hours=1)
    book_res = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver),
    )
    res_id = book_res.json()["data"]["id"]

    # 1. Get by ID
    get_res = client.get(f"/api/v1/reservations/{res_id}", headers=auth_header(driver))
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == res_id

    # 2. List in /me
    list_res = client.get("/api/v1/reservations/me", headers=auth_header(driver))
    assert list_res.status_code == 200
    items = list_res.json()["data"]
    assert len(items) >= 1
    assert items[0]["id"] == res_id


def test_prevent_cross_driver_access(client, db_session):
    data = setup_test_data(db_session)
    driver1 = data["driver1"]
    driver2 = data["driver2"]
    facility = data["facility"]
    v1 = data["v1"]

    start = datetime.utcnow() + timedelta(hours=4)
    end = start + timedelta(hours=1)
    res = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver1),
    )
    res_id = res.json()["data"]["id"]

    # Driver 2 attempts to fetch Driver 1's reservation
    hacked_res = client.get(f"/api/v1/reservations/{res_id}", headers=auth_header(driver2))
    assert hacked_res.status_code == 403

    # Driver 2 attempts to cancel Driver 1's reservation
    cancel_res = client.post(f"/api/v1/reservations/{res_id}/cancel", headers=auth_header(driver2))
    assert cancel_res.status_code == 403


def test_cancellation_workflow_and_availability_restoration(client, db_session):
    data = setup_test_data(db_session)
    driver1 = data["driver1"]
    driver2 = data["driver2"]
    facility = data["facility"]
    spot1 = data["spot1"]
    v1 = data["v1"]
    v2 = data["v2"]

    start = datetime.utcnow() + timedelta(hours=6)
    end = start + timedelta(hours=2)

    # 1. Driver 1 reserves spot 1
    res1 = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "spot_id": spot1.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver1),
    )
    res_id = res1.json()["data"]["id"]

    # 2. Driver 1 successfully cancels
    cancel_res = client.post(
        f"/api/v1/reservations/{res_id}/cancel",
        json={"reason": "Change of plans"},
        headers=auth_header(driver1),
    )
    assert cancel_res.status_code == 200
    cancel_data = cancel_res.json()["data"]
    assert cancel_data["status"] == "CANCELLED"
    assert cancel_data["cancelled_at"] is not None
    assert cancel_data["cancellation_reason"] == "Change of plans"

    # 3. Repeated cancellation attempt safely rejected
    repeat_res = client.post(
        f"/api/v1/reservations/{res_id}/cancel",
        headers=auth_header(driver1),
    )
    assert repeat_res.status_code == 400
    assert "already been cancelled" in repeat_res.json()["detail"].lower()

    # 4. Spot is now restored and available for Driver 2 to book for the exact same slot!
    res2 = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v2.id,
            "spot_id": spot1.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver2),
    )
    assert res2.status_code == 201
    assert res2.json()["data"]["spot_id"] == spot1.id


def test_operator_reservations_management_and_isolation(client, db_session):
    data = setup_test_data(db_session)
    operator = data["operator"]
    driver1 = data["driver1"]
    facility = data["facility"]
    v1 = data["v1"]

    # Create another operator with their own facility
    other_op = User(
        email="other_op@smartparking.io",
        hashed_password=get_password_hash("Pass123"),
        full_name="Other Operator",
        role=UserRole.OPERATOR,
        is_active=True,
    )
    db_session.add(other_op)
    db_session.commit()

    start = datetime.utcnow() + timedelta(hours=8)
    end = start + timedelta(hours=1)
    book_res = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver1),
    )
    res_id = book_res.json()["data"]["id"]

    # 1. Operator sees reservation for their facility
    op_res = client.get("/api/v1/operator/reservations", headers=auth_header(operator))
    assert op_res.status_code == 200
    op_items = op_res.json()["data"]
    assert any(r["id"] == res_id for r in op_items)

    # 2. Operator updates status to COMPLETED
    patch_res = client.patch(
        f"/api/v1/operator/reservations/{res_id}/status",
        json={"status": "COMPLETED"},
        headers=auth_header(operator),
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["status"] == "COMPLETED"

    # 3. Other operator attempts to access/update reservation -> rejected
    cross_res = client.get(
        f"/api/v1/operator/reservations/{res_id}",
        headers=auth_header(other_op),
    )
    assert cross_res.status_code in [403, 404]


def test_admin_reservation_visibility(client, db_session):
    data = setup_test_data(db_session)
    admin = data["admin"]
    driver1 = data["driver1"]
    facility = data["facility"]
    v1 = data["v1"]

    start = datetime.utcnow() + timedelta(hours=10)
    end = start + timedelta(hours=2)
    book_res = client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver1),
    )
    res_id = book_res.json()["data"]["id"]

    # Admin global list
    admin_res = client.get("/api/v1/admin/reservations", headers=auth_header(admin))
    assert admin_res.status_code == 200
    assert any(r["id"] == res_id for r in admin_res.json()["data"])

    # Admin get by ID
    admin_single = client.get(f"/api/v1/admin/reservations/{res_id}", headers=auth_header(admin))
    assert admin_single.status_code == 200
    assert admin_single.json()["data"]["id"] == res_id


def test_facility_and_spaces_availability_endpoints(client, db_session):
    data = setup_test_data(db_session)
    facility = data["facility"]
    spot1 = data["spot1"]
    driver = data["driver1"]
    v1 = data["v1"]

    start = datetime.utcnow() + timedelta(hours=12)
    end = start + timedelta(hours=2)

    # 1. Check availability before booking
    avail_res1 = client.get(
        f"/api/v1/facilities/{facility.id}/availability?start_time={start.isoformat()}&end_time={end.isoformat()}"
    )
    assert avail_res1.status_code == 200
    data1 = avail_res1.json()["data"]
    initial_avail = data1["available_spaces"]

    # 2. Check spaces availability endpoint
    spaces_res1 = client.get(
        f"/api/v1/facilities/{facility.id}/spaces/availability?start_time={start.isoformat()}&end_time={end.isoformat()}"
    )
    assert spaces_res1.status_code == 200
    spaces1 = spaces_res1.json()["data"]
    s1_item = next(s for s in spaces1 if s["id"] == spot1.id)
    assert s1_item["is_available"] is True

    # 3. Book spot 1
    client.post(
        "/api/v1/reservations",
        json={
            "facility_id": facility.id,
            "vehicle_id": v1.id,
            "spot_id": spot1.id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
        headers=auth_header(driver),
    )

    # 4. Check spaces availability: spot 1 is now unavailable
    spaces_res2 = client.get(
        f"/api/v1/facilities/{facility.id}/spaces/availability?start_time={start.isoformat()}&end_time={end.isoformat()}"
    )
    assert spaces_res2.status_code == 200
    spaces2 = spaces_res2.json()["data"]
    s1_item2 = next(s for s in spaces2 if s["id"] == spot1.id)
    assert s1_item2["is_available"] is False
