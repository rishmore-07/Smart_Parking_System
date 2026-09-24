def get_auth_header(client, email="driver_vehicle@example.com"):
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Vehicle Driver",
        "password": "Password123",
        "role": "driver"
    })
    token = reg.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_vehicle_creation_and_listing(client):
    headers = get_auth_header(client)

    # 1. Create first vehicle (should automatically become default)
    v1_payload = {
        "license_plate": "KA-01-AB-1234",
        "make": "Hyundai",
        "model": "Ioniq 5",
        "color": "Matte Gold",
        "vehicle_type": "ev",
        "is_default": False
    }
    res1 = client.post("/api/v1/vehicles/", json=v1_payload, headers=headers)
    assert res1.status_code == 201
    v1_data = res1.json()["data"]
    assert v1_data["license_plate"] == "KA-01-AB-1234"
    assert v1_data["is_default"] is True  # First vehicle defaults to True

    # 2. Create second vehicle
    v2_payload = {
        "license_plate": "KA-01-CD-5678",
        "make": "Honda",
        "model": "City",
        "color": "Silver",
        "vehicle_type": "car",
        "is_default": True
    }
    res2 = client.post("/api/v1/vehicles/", json=v2_payload, headers=headers)
    assert res2.status_code == 201
    v2_data = res2.json()["data"]
    assert v2_data["is_default"] is True

    # 3. List vehicles
    list_res = client.get("/api/v1/vehicles/", headers=headers)
    assert list_res.status_code == 200
    vehicles = list_res.json()["data"]
    assert len(vehicles) == 2
    # Verify only the second vehicle is now default
    defaults = [v for v in vehicles if v["is_default"]]
    assert len(defaults) == 1
    assert defaults[0]["license_plate"] == "KA-01-CD-5678"


def test_vehicle_update_and_delete(client):
    headers = get_auth_header(client, "driver_mod@example.com")
    res = client.post("/api/v1/vehicles/", json={
        "license_plate": "MH-12-XX-9999",
        "make": "Ford",
        "model": "Mustang",
        "color": "Red",
        "vehicle_type": "car"
    }, headers=headers)
    vehicle_id = res.json()["data"]["id"]

    # Update
    update_res = client.put(f"/api/v1/vehicles/{vehicle_id}", json={
        "color": "Deep Blue",
        "license_plate": "MH-12-XX-9999"
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["data"]["color"] == "Deep Blue"

    # Delete
    del_res = client.delete(f"/api/v1/vehicles/{vehicle_id}", headers=headers)
    assert del_res.status_code == 200

    # Ensure it no longer exists
    get_res = client.get(f"/api/v1/vehicles/{vehicle_id}", headers=headers)
    assert get_res.status_code == 404
