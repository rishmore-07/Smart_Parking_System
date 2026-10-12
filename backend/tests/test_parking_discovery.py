import pytest
from app.models.facility import ParkingFacility, FacilityStatus
from app.models.spot import ParkingSpot, SpotType, SpotStatus
from datetime import time


@pytest.fixture
def sample_facilities(db_session):
    # Facility 1: BKC Central, 100 cap, 60 avail (HIGH tier), price 50, rating 4.8
    f1 = ParkingFacility(
        name="BKC Central Smart Park",
        address="BKC G Block",
        latitude=19.0655,
        longitude=72.8643,
        total_capacity=100,
        available_capacity=60,
        price_per_hour=50.0,
        rating=4.8,
        security_available=True,
        ev_charging_available=True,
        accessible_parking=True,
        status=FacilityStatus.OPEN,
        opening_time=time(6, 0),
        closing_time=time(23, 0),
    )
    # Facility 2: BKC East Budget, 50 cap, 5 avail (LOW tier), price 30, rating 3.8
    f2 = ParkingFacility(
        name="BKC East Budget Lot",
        address="BKC East Gate",
        latitude=19.0680,
        longitude=72.8690,
        total_capacity=50,
        available_capacity=5,
        price_per_hour=30.0,
        rating=3.8,
        security_available=True,
        ev_charging_available=False,
        accessible_parking=False,
        status=FacilityStatus.OPEN,
        opening_time=time(8, 0),
        closing_time=time(20, 0),
    )
    # Facility 3: Colaba (Far away > 15km), 40 cap, 0 avail (FULL tier), price 90, rating 4.5
    f3 = ParkingFacility(
        name="Colaba Sea View",
        address="Colaba Causeway",
        latitude=18.9171,
        longitude=72.8277,
        total_capacity=40,
        available_capacity=0,
        price_per_hour=90.0,
        rating=4.5,
        security_available=True,
        ev_charging_available=True,
        accessible_parking=True,
        status=FacilityStatus.OPEN,
    )
    db_session.add_all([f1, f2, f3])
    db_session.commit()
    db_session.refresh(f1)
    db_session.refresh(f2)
    db_session.refresh(f3)

    # Add spots for f1
    s1 = ParkingSpot(
        facility_id=f1.id,
        spot_number="A-01",
        floor="Ground",
        spot_type=SpotType.STANDARD,
        status=SpotStatus.AVAILABLE,
    )
    s2 = ParkingSpot(
        facility_id=f1.id,
        spot_number="A-02",
        floor="Ground",
        spot_type=SpotType.EV,
        status=SpotStatus.OCCUPIED,
    )
    db_session.add_all([s1, s2])
    db_session.commit()

    return f1, f2, f3


def test_get_nearby_parking(client, sample_facilities):
    f1, f2, f3 = sample_facilities
    res = client.get("/api/parking/nearby", params={"lat": 19.0655, "lng": 72.8643, "radius_km": 3.0})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    items = data["data"]["items"]
    assert len(items) == 2
    names = [i["name"] for i in items]
    assert "BKC Central Smart Park" in names
    assert "BKC East Budget Lot" in names
    assert "Colaba Sea View" not in names


def test_search_parking_by_text(client, sample_facilities):
    res = client.get("/api/parking/search", params={"q": "Central"})
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "BKC Central Smart Park"


def test_get_facility_by_id(client, sample_facilities):
    f1, f2, f3 = sample_facilities
    res = client.get(f"/api/parking/{f1.id}")
    assert res.status_code == 200
    fac = res.json()["data"]
    assert fac["id"] == f1.id
    assert fac["name"] == "BKC Central Smart Park"
    assert len(fac["spots"]) == 2
    assert fac["availability_tier"] == "HIGH"


def test_get_facility_invalid_id(client, sample_facilities):
    res = client.get("/api/parking/999999")
    assert res.status_code == 404


def test_radius_validation(client):
    res = client.get("/api/parking/nearby", params={"lat": 19.0, "lng": 72.0, "radius_km": -5})
    assert res.status_code == 422
    res2 = client.get("/api/parking/nearby", params={"lat": 19.0, "lng": 72.0, "radius_km": 150})
    assert res2.status_code == 422


def test_distance_calculation_and_formatting(client, sample_facilities):
    res = client.get("/api/parking/nearby", params={"lat": 19.0655, "lng": 72.8643, "radius_km": 5.0})
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    first = items[0]
    assert first["distance_km"] == 0.0
    assert first["distance_text"] == "0 m away"


def test_filter_by_price(client, sample_facilities):
    res = client.get("/api/parking/search", params={"max_price": 40})
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "BKC East Budget Lot"


def test_filter_by_availability(client, sample_facilities):
    res = client.get("/api/parking/search", params={"min_available": 10})
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "BKC Central Smart Park"


def test_filter_by_ev(client, sample_facilities):
    res = client.get("/api/parking/search", params={"has_ev": True})
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) == 2
    names = [i["name"] for i in items]
    assert "BKC Central Smart Park" in names
    assert "Colaba Sea View" in names


def test_filter_by_security(client, sample_facilities):
    res = client.get("/api/parking/search", params={"has_security": True})
    assert res.status_code == 200
    assert len(res.json()["data"]["items"]) == 3


def test_filter_by_accessibility(client, sample_facilities):
    res = client.get("/api/parking/search", params={"has_accessibility": True})
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) == 2


def test_sorting_by_distance(client, sample_facilities):
    res = client.get("/api/parking/nearby", params={"lat": 19.0650, "lng": 72.8640, "sort_by": "distance"})
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert items[0]["name"] == "BKC Central Smart Park"


def test_sorting_by_price(client, sample_facilities):
    res = client.get("/api/parking/search", params={"sort_by": "price"})
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert items[0]["price_per_hour"] == 30.0
    assert items[-1]["price_per_hour"] == 90.0


def test_sorting_by_availability(client, sample_facilities):
    res = client.get("/api/parking/search", params={"sort_by": "available"})
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert items[0]["available_spaces"] == 60
    assert items[-1]["available_spaces"] == 0


def test_sorting_by_rating(client, sample_facilities):
    res = client.get("/api/parking/search", params={"sort_by": "rating"})
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert items[0]["rating"] == 4.8
    assert items[-1]["rating"] == 3.8


def test_empty_results(client, sample_facilities):
    res = client.get("/api/parking/search", params={"q": "NonExistentParkingFacilityXYZ"})
    assert res.status_code == 200
    assert len(res.json()["data"]["items"]) == 0
    assert res.json()["data"]["total"] == 0
