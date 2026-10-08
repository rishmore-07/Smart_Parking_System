from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token


def test_role_based_access_control(client, db_session):
    # 1. Register a standard Driver through public endpoint
    driver_reg = client.post("/api/v1/auth/register", json={
        "email": "driver_rbac@example.com",
        "full_name": "Standard Driver",
        "password": "Password123",
    })
    assert driver_reg.status_code == 201
    driver_data = driver_reg.json()["data"]
    driver_token = driver_data["access_token"]
    driver_id = driver_data["user"]["id"]
    assert driver_data["user"]["role"] == "driver"

    # 2. Provision an Admin directly through database/controlled process
    admin_user = User(
        email="admin_rbac@example.com",
        hashed_password=get_password_hash("AdminPassword123"),
        full_name="Admin Officer",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
        auth_provider="local"
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)

    admin_token = create_access_token(
        subject=admin_user.id,
        role=admin_user.role.value,
        email=admin_user.email,
        full_name=admin_user.full_name
    )

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

    # 5. Non-admin (driver) attempts to promote/change a user role -> 403 Forbidden
    driver_promote_resp = client.put(
        f"/api/v1/users/{driver_id}/role",
        json={"role": "operator"},
        headers={"Authorization": f"Bearer {driver_token}"}
    )
    assert driver_promote_resp.status_code == 403

    # 6. Admin provisions the driver to OPERATOR role -> 200 OK
    admin_promote_resp = client.put(
        f"/api/v1/users/{driver_id}/role",
        json={"role": "operator"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_promote_resp.status_code == 200
    assert admin_promote_resp.json()["data"]["role"] == "operator"
