from fastapi.testclient import TestClient

from app import app


client = TestClient(app)


def test_recommendation_preserves_selected_location_context() -> None:
    response = client.post(
        "/recommend",
        json={
            "request_id": "req-home-001",
            "location": {
                "id": "loc-home",
                "label": "Home",
                "latitude": 6.9271,
                "longitude": 79.8612,
                "timezone": "Asia/Colombo",
            },
            "current": {
                "temperature_c": 31,
                "uv_index": 7,
                "condition": "clear",
            },
        },
    )
    assert response.status_code == 200
    assert response.json()["location"] == {
        "id": "loc-home",
        "label": "Home",
        "latitude": 6.9271,
        "longitude": 79.8612,
        "timezone": "Asia/Colombo",
    }
    assert response.json()["assistant_context"]["location_label"] == "Home"


def test_destination_context_is_not_replaced_by_home() -> None:
    response = client.post(
        "/recommend",
        json={
            "location": {
                "id": "loc-destination",
                "label": "Destination",
                "latitude": 7.2906,
                "longitude": 80.6337,
                "timezone": "Asia/Colombo",
            },
            "current": {"temperature_c": 24, "condition": "clear"},
        },
    )
    assert response.status_code == 200
    assert response.json()["location"]["label"] == "Destination"
    assert response.json()["location"]["id"] == "loc-destination"


def test_invalid_coordinates_are_not_used() -> None:
    response = client.post(
        "/recommend",
        json={
            "location": {"label": "Home", "latitude": 120, "longitude": 79},
            "current": {"temperature_c": 24},
        },
    )
    assert response.status_code == 200
    assert response.json()["location"]["latitude"] is None
    assert "latitude_invalid" in response.json()["assistant_context"]["limitations"]


def test_envelope_requires_location_context() -> None:
    response = client.post(
        "/recommend",
        json={"current": {"temperature_c": 24, "condition": "clear"}},
    )
    assert response.status_code == 422
