def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"


def test_user_registration_success(client):
    payload = {
        "email": "testdriver@example.com",
        "full_name": "Test Driver",
        "password": "Password123!",
        "phone_number": "+1234567890",
        "role": "driver"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["success"] is True
    assert "access_token" in res_data["data"]
    assert res_data["data"]["user"]["email"] == "testdriver@example.com"
    assert res_data["data"]["user"]["role"] == "driver"


def test_user_duplicate_registration_fails(client):
    payload = {
        "email": "duplicate@example.com",
        "full_name": "Duplicate User",
        "password": "Password123!",
    }
    # Register once
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Register again with same email
    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_user_login_success(client):
    # Register
    client.post("/api/v1/auth/register", json={
        "email": "loginuser@example.com",
        "full_name": "Login User",
        "password": "CorrectPassword123",
    })

    # Login
    response = client.post("/api/v1/auth/login", json={
        "email": "loginuser@example.com",
        "password": "CorrectPassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]


def test_user_login_invalid_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "wrongpwd@example.com",
        "full_name": "User",
        "password": "RightPassword123",
    })

    response = client.post("/api/v1/auth/login", json={
        "email": "wrongpwd@example.com",
        "password": "WrongPassword456",
    })
    assert response.status_code == 401


def test_get_current_user_me(client):
    # Register
    reg = client.post("/api/v1/auth/register", json={
        "email": "me@example.com",
        "full_name": "Me User",
        "password": "Password123",
    })
    token = reg.json()["data"]["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "me@example.com"


def test_user_registration_invalid_input(client):
    # Invalid email
    res1 = client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "full_name": "Test User",
        "password": "ValidPassword123",
    })
    assert res1.status_code == 422

    # Password too short (<6 chars)
    res2 = client.post("/api/v1/auth/register", json={
        "email": "shortpw@example.com",
        "full_name": "Test User",
        "password": "123",
    })
    assert res2.status_code == 422

    # Empty full name
    res3 = client.post("/api/v1/auth/register", json={
        "email": "noname@example.com",
        "full_name": "A",  # min_length is 2
        "password": "ValidPassword123",
    })
    assert res3.status_code == 422


def test_prevent_public_admin_operator_role_assignment(client):
    # Public registration passing 'admin' should NOT be granted admin role
    res_admin = client.post("/api/v1/auth/register", json={
        "email": "sneakyadmin@example.com",
        "full_name": "Sneaky Admin",
        "password": "Password123",
        "role": "admin",
    })
    assert res_admin.status_code == 201
    assert res_admin.json()["data"]["user"]["role"] == "driver"

    # Public registration passing 'operator' should NOT be granted operator role
    res_op = client.post("/api/v1/auth/register", json={
        "email": "sneakyoperator@example.com",
        "full_name": "Sneaky Operator",
        "password": "Password123",
        "role": "operator",
    })
    assert res_op.status_code == 201
    assert res_op.json()["data"]["user"]["role"] == "driver"


def test_user_logout_success(client):
    reg = client.post("/api/v1/auth/register", json={
        "email": "logoutuser@example.com",
        "full_name": "Logout User",
        "password": "Password123",
    })
    token = reg.json()["data"]["access_token"]

    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "Logged out" in response.json()["message"]


def test_access_protected_endpoint_without_auth(client):
    res_me = client.get("/api/v1/auth/me")
    assert res_me.status_code == 401

    res_vehicles = client.get("/api/v1/vehicles/")
    assert res_vehicles.status_code == 401


def test_invalid_and_expired_jwt(client):
    # Invalid JWT token
    res_inv = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.value"}
    )
    assert res_inv.status_code == 401

    # Expired token
    from datetime import timedelta
    from app.core.security import create_access_token
    expired_token = create_access_token(
        subject=9999,
        role="driver",
        email="expired@example.com",
        full_name="Expired User",
        expires_delta=timedelta(seconds=-10)
    )
    res_exp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res_exp.status_code == 401
    assert "expired" in res_exp.json()["detail"].lower()
