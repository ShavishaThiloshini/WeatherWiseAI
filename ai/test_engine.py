from engine.recommendation.engine import recommend_from_payload, run_engine
from engine.snapshot import snapshot_from_request


def categories(payload: dict) -> set[str]:
    result = recommend_from_payload(payload)
    return {item["category"] for item in result["recommendations"]}


def messages(payload: dict) -> str:
    result = recommend_from_payload(payload)
    return " ".join(item["message"].lower() for item in result["recommendations"])


def test_comfortable_day() -> None:
    payload = {
        "temperature": 22,
        "feels_like": 22,
        "humidity": 50,
        "wind_speed": 10,
        "uv_index": 4,
        "rain_probability": 10,
        "condition": "partly_cloudy",
    }
    result = recommend_from_payload(payload)
    analysis = result["analysis"]
    assert analysis["temperature"] == "comfortable"
    assert analysis["risks"]["overall"] in {"SAFE", "LOW"}
    assert analysis["activity"] in {"Excellent", "Good"}
    assert result["alerts"] == []
    text = messages(payload)
    assert "thunderstorm" not in text
    assert "heavy rain" not in text


def test_hot_day() -> None:
    payload = {
        "temperature": 36,
        "feels_like": 38,
        "humidity": 70,
        "uv_index": 9,
        "rain_probability": 10,
        "wind_speed": 8,
        "condition": "clear",
    }
    text = messages(payload)
    cats = categories(payload)
    assert "hydration" in cats
    assert "Stay hydrated" in text or "hydrated" in text
    assert "sun" in text or "uv" in text or "shade" in text
    result = recommend_from_payload(payload)
    assert result["analysis"]["activity"] in {"Moderate", "Poor", "Avoid"}
    assert result["analysis"]["risks"]["heat"] in {"HIGH", "CRITICAL"}


def test_heavy_rain() -> None:
    payload = {
        "temperature": 24,
        "rain_probability": 90,
        "rain_intensity": "heavy",
        "condition": "rain",
        "wind_speed": 12,
        "uv_index": 2,
    }
    cats = categories(payload)
    text = messages(payload)
    assert "umbrella" in cats
    assert "travel" in cats
    assert "umbrella" in text or "raincoat" in text
    assert recommend_from_payload(payload)["analysis"]["activity"] in {"Poor", "Avoid"}


def test_thunderstorm_overrides_activity() -> None:
    payload = {"temperature": 24, "condition": "thunderstorm", "rain_probability": 80, "wind_speed": 20}
    result = recommend_from_payload(payload)
    first = result["recommendations"][0]
    assert first["severity"] == "danger"
    assert first["priority"] == "CRITICAL"
    assert result["analysis"]["activity"] == "Avoid"
    assert result["alerts"]
    assert any(item.get("encourage_outdoor") is not True for item in result["recommendations"])
    text = messages(payload)
    assert "great day for outdoor" not in text
    assert "postpone" in text or "avoid open" in text


def test_strong_wind() -> None:
    payload = {"temperature": 22, "wind_speed": 45, "rain_probability": 5, "uv_index": 3, "condition": "windy"}
    result = recommend_from_payload(payload)
    assert result["analysis"]["wind"] == "strong"
    assert result["analysis"]["risks"]["wind"] == "HIGH"
    assert result["analysis"]["activity"] in {"Poor", "Moderate", "Avoid"}
    assert "wind" in messages(payload)


def test_cold_weather() -> None:
    payload = {"temperature": 8, "feels_like": 4, "wind_speed": 10, "rain_probability": 5, "condition": "cloudy"}
    text = messages(payload)
    assert "jacket" in text or "warm" in text or "layer" in text
    assert recommend_from_payload(payload)["analysis"]["risks"]["cold"] in {"MODERATE", "HIGH", "CRITICAL"}


def test_high_uv() -> None:
    payload = {
        "temperature": 24,
        "uv_index": 11,
        "rain_probability": 5,
        "wind_speed": 8,
        "condition": "clear",
    }
    text = messages(payload)
    assert "sunscreen" in text or "shade" in text or "sun" in text
    assert recommend_from_payload(payload)["analysis"]["risks"]["uv"] in {"HIGH", "CRITICAL"}


def test_hot_and_high_humidity() -> None:
    payload = {"temperature": 33, "humidity": 85, "uv_index": 5, "rain_probability": 5, "condition": "clear"}
    assert recommend_from_payload(payload)["analysis"]["risks"]["heat"] in {"HIGH", "MODERATE"}
    assert "hydration" in categories(payload)


def test_thunderstorm_and_heavy_rain() -> None:
    payload = {
        "temperature": 23,
        "condition": "thunderstorm",
        "rain_probability": 95,
        "rain_intensity": "heavy",
        "wind_speed": 30,
    }
    result = recommend_from_payload(payload)
    assert result["analysis"]["activity"] == "Avoid"
    assert result["recommendations"][0]["priority"] == "CRITICAL"
    assert "umbrella" in categories(payload)


def test_cold_and_strong_wind() -> None:
    payload = {"temperature": 6, "feels_like": 1, "wind_speed": 42, "condition": "cloudy"}
    risks = recommend_from_payload(payload)["analysis"]["risks"]
    assert risks["cold"] in {"HIGH", "CRITICAL"}
    assert risks["wind"] == "HIGH"


def test_hot_and_rain_combines_clothing() -> None:
    payload = {
        "temperature": 33,
        "rain_probability": 75,
        "rain_intensity": "moderate",
        "condition": "rain",
        "uv_index": 3,
    }
    clothing = [
        item
        for item in recommend_from_payload(payload)["recommendations"]
        if item["category"] == "clothing" and item["id"] == "clothing-01"
    ]
    assert clothing
    message = clothing[0]["message"].lower()
    assert "breathable" in message or "lightweight" in message
    assert "waterproof" in message


def test_missing_temperature_skips_heat_and_clothing() -> None:
    weather = snapshot_from_request(
        {"current": {"observed_at": "2026-09-08T08:00:00Z", "uv_index": 9, "condition": "clear"}}
    )
    result = run_engine(weather)
    categories_found = {item.category for item in result.recommendations}
    assert "hydration" not in categories_found
    assert result.analysis.temperature is None
    assert "temperature_missing" in result.limitations
    assert any(item.id == "uv-protection-01" for item in result.recommendations)


def test_invalid_wind_is_skipped() -> None:
    payload = {"temperature": 22, "wind_speed": -5, "uv_index": 2, "rain_probability": 5, "condition": "clear"}
    result = recommend_from_payload(payload)
    assert result["analysis"]["wind"] is None
    assert result["analysis"]["risks"]["wind"] == "SAFE"


def test_low_rain_does_not_warn() -> None:
    payload = {"temperature": 22, "rain_probability": 10, "uv_index": 3, "wind_speed": 8, "condition": "clear"}
    assert "umbrella" not in categories(payload)


def test_envelope_rain_later_mentions_timing() -> None:
    payload = {
        "request_id": "req_later",
        "location": {"id": "loc_home", "label": "Home", "latitude": 6.9, "longitude": 79.8},
        "current": {
            "observed_at": "2026-09-08T08:00:00+05:30",
            "temperature_c": 27,
            "rain_probability_percent": 15,
            "condition": "partly_cloudy",
        },
        "forecast": {
            "hours": [
                {"time": "t1", "rain_probability_percent": 10, "condition": "clear"},
                {"time": "t2", "rain_probability_percent": 10, "condition": "clear"},
                {"time": "t3", "rain_probability_percent": 10, "condition": "clear"},
                {"time": "t4", "rain_probability_percent": 80, "rain_intensity": "moderate", "condition": "rain"},
            ]
        },
    }
    text = messages(payload)
    assert "later" in text
    assert "umbrella" in categories(payload)
