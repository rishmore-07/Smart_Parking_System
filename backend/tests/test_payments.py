import hmac
import hashlib
import json
import pytest
from datetime import datetime, timedelta
from app.core.config import settings
from app.models.facility import ParkingFacility, FacilityStatus
from app.models.spot import ParkingSpot, SpotType, SpotStatus
from app.models.vehicle import Vehicle, VehicleType
from app.models.reservation import Reservation, ReservationStatus
from app.models.payment import Payment, Receipt, PaymentStatus, PaymentMethod


@pytest.fixture
def payment_setup(db_session, client):
    # 1. Driver 1
    reg1 = client.post("/api/v1/auth/register", json={
        "email": "driver_pay1@example.com",
        "full_name": "Driver Pay One",
        "password": "Password123",
        "role": "driver"
    })
    token1 = reg1.json()["data"]["access_token"]
    user1_id = reg1.json()["data"]["user"]["id"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 2. Driver 2 (for cross-user isolation tests)
    reg2 = client.post("/api/v1/auth/register", json={
        "email": "driver_pay2@example.com",
        "full_name": "Driver Pay Two",
        "password": "Password123",
        "role": "driver"
    })
    token2 = reg2.json()["data"]["access_token"]
    user2_id = reg2.json()["data"]["user"]["id"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 3. Facility
    facility = ParkingFacility(
        name="Razorpay Test Plaza",
        address="123 Gateway Blvd, Tech City",
        latitude=19.0760,
        longitude=72.8777,
        total_capacity=20,
        available_capacity=20,
        price_per_hour=75.0,
        status=FacilityStatus.OPEN,
    )
    db_session.add(facility)
    db_session.commit()
    db_session.refresh(facility)

    # 4. Spot
    spot = ParkingSpot(
        facility_id=facility.id,
        spot_number="PAY-01",
        floor="Ground",
        spot_type=SpotType.STANDARD,
        status=SpotStatus.AVAILABLE,
        is_active=True,
    )
    db_session.add(spot)

    # 5. Vehicle for Driver 1
    vehicle1 = Vehicle(
        user_id=user1_id,
        license_plate="MH-02-PAY-1111",
        make="Tesla",
        model="Model 3",
        vehicle_type=VehicleType.CAR,
    )
    # Vehicle for Driver 2
    vehicle2 = Vehicle(
        user_id=user2_id,
        license_plate="MH-02-PAY-2222",
        make="Hyundai",
        model="Kona",
        vehicle_type=VehicleType.EV,
    )
    db_session.add_all([vehicle1, vehicle2])
    db_session.commit()
    db_session.refresh(spot)
    db_session.refresh(vehicle1)
    db_session.refresh(vehicle2)

    # 6. Reservation for Driver 1 (2 hours -> ₹150.00)
    start_time = datetime.utcnow() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=2)
    reservation1 = Reservation(
        booking_code="SPF-PAY-TEST1",
        user_id=user1_id,
        facility_id=facility.id,
        spot_id=spot.id,
        vehicle_id=vehicle1.id,
        start_time=start_time,
        end_time=end_time,
        total_amount=150.0,
        rate_per_hour=75.0,
        currency="INR",
        status=ReservationStatus.CONFIRMED,
    )
    db_session.add(reservation1)
    db_session.commit()
    db_session.refresh(reservation1)

    return {
        "headers1": headers1,
        "user1_id": user1_id,
        "headers2": headers2,
        "user2_id": user2_id,
        "facility": facility,
        "spot": spot,
        "reservation1": reservation1,
    }


def test_payment_order_creation_success(client, payment_setup):
    res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["reservation_id"] == payment_setup["reservation1"].id
    assert data["amount"] == 150.0
    assert data["amount_paise"] == 15000
    assert data["currency"] == "INR"
    assert data["key_id"] == settings.RAZORPAY_KEY_ID
    assert data["order_id"].startswith("order_")


def test_unauthenticated_payment_order_fails(client, payment_setup):
    res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
    )
    assert res.status_code == 401


def test_prevent_cross_driver_payment_order(client, payment_setup):
    # Driver 2 tries to create order for Driver 1's reservation -> 403 Forbidden
    res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers2"],
    )
    assert res.status_code == 403
    assert "permission" in res.json()["detail"].lower()


def test_cannot_pay_for_cancelled_reservation(client, payment_setup, db_session):
    resv = payment_setup["reservation1"]
    resv.status = ReservationStatus.CANCELLED
    db_session.commit()

    res = client.post(
        f"/api/v1/reservations/{resv.id}/payment/order",
        headers=payment_setup["headers1"],
    )
    assert res.status_code == 400
    assert "cancelled" in res.json()["detail"].lower()


def test_repeated_order_creation_is_idempotent(client, payment_setup):
    # Call 1
    res1 = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    assert res1.status_code == 201
    order_id_1 = res1.json()["data"]["order_id"]

    # Call 2 should reuse the existing pending order
    res2 = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    assert res2.status_code == 201
    order_id_2 = res2.json()["data"]["order_id"]
    assert order_id_1 == order_id_2


def test_payment_verification_valid_signature_generates_receipt(client, payment_setup):
    # 1. Create order
    order_res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    order_id = order_res.json()["data"]["order_id"]
    payment_id = "pay_test_123456789"

    # Compute valid signature
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
    valid_signature = hmac.new(secret, msg, hashlib.sha256).hexdigest()

    # 2. Verify payment
    verify_res = client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_signature,
            "reservation_id": payment_setup["reservation1"].id,
        },
        headers=payment_setup["headers1"],
    )
    assert verify_res.status_code == 200
    payment_data = verify_res.json()["data"]
    assert payment_data["status"] == "COMPLETED"
    assert payment_data["razorpay_payment_id"] == payment_id
    assert payment_data["receipt"] is not None
    assert payment_data["receipt"]["total_amount"] == 150.0
    assert payment_data["receipt"]["receipt_number"].startswith("RCP-")


def test_payment_verification_invalid_signature_fails(client, payment_setup):
    order_res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    order_id = order_res.json()["data"]["order_id"]

    # Verify with invalid signature
    verify_res = client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_fake_9999",
            "razorpay_signature": "invalid_forged_signature_hex",
            "reservation_id": payment_setup["reservation1"].id,
        },
        headers=payment_setup["headers1"],
    )
    assert verify_res.status_code == 400
    assert "signature" in verify_res.json()["detail"].lower()


def test_cross_driver_payment_verification_fails(client, payment_setup):
    # Driver 1 creates order
    order_res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    order_id = order_res.json()["data"]["order_id"]
    payment_id = "pay_test_driver1"
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    valid_signature = hmac.new(settings.RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    # Driver 2 tries to verify Driver 1's payment -> 403 Forbidden
    verify_res = client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_signature,
        },
        headers=payment_setup["headers2"],
    )
    assert verify_res.status_code == 403


def test_payment_verification_idempotency_no_duplicate_receipt(client, payment_setup):
    order_res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    order_id = order_res.json()["data"]["order_id"]
    payment_id = "pay_test_idemp_1"
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    payload = {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": sig,
    }

    # First verification
    res1 = client.post("/api/v1/payments/verify", json=payload, headers=payment_setup["headers1"])
    assert res1.status_code == 200
    receipt1_id = res1.json()["data"]["receipt"]["id"]

    # Second verification with same params -> idempotent return of existing completed payment
    res2 = client.post("/api/v1/payments/verify", json=payload, headers=payment_setup["headers1"])
    assert res2.status_code == 200
    receipt2_id = res2.json()["data"]["receipt"]["id"]
    assert receipt1_id == receipt2_id


def test_cannot_create_order_for_already_paid_reservation(client, payment_setup):
    # 1. Create order & verify
    order_res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    order_id = order_res.json()["data"]["order_id"]
    payment_id = "pay_already_paid"
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    client.post("/api/v1/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": sig,
    }, headers=payment_setup["headers1"])

    # 2. Attempt to create order again -> 400 Already paid
    new_order_res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    assert new_order_res.status_code == 400
    assert "already been paid" in new_order_res.json()["detail"].lower()


def test_get_payment_and_receipt_endpoints(client, payment_setup):
    # Complete payment
    order_res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    order_id = order_res.json()["data"]["order_id"]
    payment_id = "pay_receipt_test"
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    sig = hmac.new(settings.RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    client.post("/api/v1/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": sig,
    }, headers=payment_setup["headers1"])

    # 1. GET payment
    get_pay = client.get(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment",
        headers=payment_setup["headers1"],
    )
    assert get_pay.status_code == 200
    assert get_pay.json()["data"]["status"] == "COMPLETED"

    # 2. GET receipt
    get_rcpt = client.get(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/receipt",
        headers=payment_setup["headers1"],
    )
    assert get_rcpt.status_code == 200
    assert get_rcpt.json()["data"]["total_amount"] == 150.0

    # 3. Driver 2 cannot access Driver 1's receipt -> 403 Forbidden
    cross_rcpt = client.get(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/receipt",
        headers=payment_setup["headers2"],
    )
    assert cross_rcpt.status_code == 403

    # 4. List my payments
    list_pay = client.get("/api/v1/payments/me", headers=payment_setup["headers1"])
    assert list_pay.status_code == 200
    assert len(list_pay.json()["data"]) >= 1


def test_razorpay_webhook_captured_and_failure(client, payment_setup):
    # Create order first
    order_res = client.post(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment/order",
        headers=payment_setup["headers1"],
    )
    order_id = order_res.json()["data"]["order_id"]

    # 1. Test invalid webhook signature
    fake_body = json.dumps({"event": "payment.captured"}).encode("utf-8")
    res_bad = client.post(
        "/api/v1/webhooks/razorpay",
        content=fake_body,
        headers={"X-Razorpay-Signature": "bad_sig"},
    )
    assert res_bad.status_code == 400

    # 2. Test valid webhook payment.captured
    webhook_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_wh_captured_1",
                    "order_id": order_id,
                    "amount": 15000,
                    "currency": "INR",
                    "status": "captured",
                }
            }
        }
    }
    raw_body = json.dumps(webhook_payload).encode("utf-8")
    valid_wh_sig = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    res_good = client.post(
        "/api/v1/webhooks/razorpay",
        content=raw_body,
        headers={"X-Razorpay-Signature": valid_wh_sig},
    )
    assert res_good.status_code == 200
    assert res_good.json()["status"] == "ok"

    # Check that payment status is now COMPLETED
    pay_check = client.get(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment",
        headers=payment_setup["headers1"],
    )
    assert pay_check.json()["data"]["status"] == "COMPLETED"

    # 3. Test that subsequent payment.failed event does NOT downgrade COMPLETED payment
    fail_payload = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_wh_failed_2",
                    "order_id": order_id,
                }
            }
        }
    }
    raw_fail_body = json.dumps(fail_payload).encode("utf-8")
    fail_sig = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"), raw_fail_body, hashlib.sha256).hexdigest()

    client.post(
        "/api/v1/webhooks/razorpay",
        content=raw_fail_body,
        headers={"X-Razorpay-Signature": fail_sig},
    )
    # Payment must remain COMPLETED
    pay_check2 = client.get(
        f"/api/v1/reservations/{payment_setup['reservation1'].id}/payment",
        headers=payment_setup["headers1"],
    )
    assert pay_check2.json()["data"]["status"] == "COMPLETED"
