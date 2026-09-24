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
