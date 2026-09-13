from fastapi.testclient import TestClient

from app import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_heat_and_uv_recommendation() -> None:
    response = client.post(
        "/recommend",
        json={"temperature": 36, "uv_index": 9},
    )
    assert response.status_code == 200
    payload = response.json()
    categories = {item["category"] for item in payload["recommendations"]}
    assert "hydration" in categories
    assert payload["analysis"]["risks"]["heat"] in {"HIGH", "CRITICAL"}
    assert payload["analysis"]["risks"]["uv"] in {"HIGH", "CRITICAL"}


def test_live_weather_envelope_drives_all_interpretation_rules() -> None:
    response = client.post(
        "/recommend",
        json={
            "request_id": "live-day-06",
            "location": {
                "id": "loc-home",
                "label": "Home",
                "latitude": 6.9271,
                "longitude": 79.8612,
                "timezone": "Asia/Colombo",
            },
            "current": {
                "observed_at": "2026-09-13T12:00:00+05:30",
                "temperature_c": 36,
                "feels_like_c": 38,
                "humidity_percent": 70,
                "wind_speed_kmh": 45,
                "wind_gust_kmh": 52,
                "uv_index": 9,
                "rain_probability_percent": 75,
                "rain_intensity": "heavy",
                "condition": "rain",
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    analysis = payload["analysis"]
    risks = analysis["risks"]

    assert payload["request_id"] == "live-day-06"
    assert analysis["temperature"] == "hot"
    assert analysis["rain"] == "heavy_rain"
    assert analysis["wind"] == "strong"
    assert analysis["uv"] == "very_high"
    assert risks["heat"] in {"HIGH", "CRITICAL"}
    assert risks["rain"] == "HIGH"
    assert risks["wind"] == "HIGH"
    assert analysis["activity"] in {"Poor", "Avoid"}


def test_storm_recommendation_is_severe() -> None:
    response = client.post(
        "/recommend",
        json={"temperature": 24, "condition": "thunderstorm"},
    )
    assert response.status_code == 200
    recommendation = response.json()["recommendations"][0]
    assert recommendation["category"] == "outdoor"
    assert recommendation["severity"] == "danger"
    assert recommendation["priority"] == "CRITICAL"
    assert response.json()["analysis"]["activity"] == "Avoid"


def test_assistant_works_without_gemini_key(monkeypatch) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.post(
        "/assistant",
        json={
            "question": "Can I go for a run?",
            "weather": {"temperature": 36, "uv_index": 9},
        },
    )
    assert response.status_code == 200
    assert response.json()["source"] == "deterministic_rules"
    assert response.json()["answer"]
