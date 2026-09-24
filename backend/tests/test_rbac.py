def test_role_based_access_control(client):
    # 1. Register a standard Driver
    driver_reg = client.post("/api/v1/auth/register", json={
        "email": "driver_rbac@example.com",
        "full_name": "Standard Driver",
        "password": "Password123",
        "role": "driver"
    })
    driver_token = driver_reg.json()["data"]["access_token"]

    # 2. Register an Admin
    admin_reg = client.post("/api/v1/auth/register", json={
        "email": "admin_rbac@example.com",
        "full_name": "Admin Officer",
        "password": "Password123",
        "role": "admin"
    })
    admin_token = admin_reg.json()["data"]["access_token"]

    # 3. Driver attempts to access Admin endpoint /api/v1/users/ -> Should receive 403 Forbidden
    driver_resp = client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {driver_token}"}
    )
    assert driver_resp.status_code == 403
    assert "Access forbidden" in driver_resp.json()["detail"]

    # 4. Admin accesses /api/v1/users/ -> Should succeed with 200 OK
    admin_resp = client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_resp.status_code == 200
    assert admin_resp.json()["success"] is True
    users = admin_resp.json()["data"]
    assert len(users) >= 2
