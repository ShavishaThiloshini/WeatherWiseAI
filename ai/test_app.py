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
            "weather": {
                "location": {"label": "Colombo"},
                "current": {
                    "temperature_c": 36,
                    "feels_like_c": 40,
                    "uv_index": 9,
                    "rain_probability_percent": 10,
                    "wind_speed_kmh": 8,
                    "condition": "clear",
                },
            },
        },
    )
    assert response.status_code == 200
    assert response.json()["source"] == "deterministic_rules"
    assert "outdoor activity is not recommended" in response.json()["answer"].lower()
    assert "colombo" in response.json()["answer"].lower()
    assert response.json()["analysis"]["activity"]


def test_assistant_answers_rain_questions_from_current_and_hourly_forecast() -> None:
    response = client.post(
        "/assistant",
        json={
            "question": "Will it rain soon, should I bring an umbrella?",
            "weather": {
                "location": {"label": "Colombo"},
                "current": {
                    "temperature_c": 29,
                    "rain_probability_percent": 20,
                    "condition": "cloudy",
                },
                "forecast": {
                    "hours": [
                        {"time": "2026-10-06T14:00", "rain_probability_percent": 80},
                        {"time": "2026-10-06T15:00", "rain_probability_percent": 60},
                    ],
                    "days": [],
                },
            },
        },
    )

    assert response.status_code == 200
    answer = response.json()["answer"].lower()
    assert "80% rain chance" in answer
    assert "next few hours" in answer
    assert "umbrella" in answer


def test_assistant_answers_tomorrow_rain_questions_from_tomorrow_daily_forecast() -> None:
    response = client.post(
        "/assistant",
        json={
            "question": "Will it rain tomorrow?",
            "weather": {
                "location": {"label": "Colombo"},
                "current": {"temperature_c": 29, "rain_probability_percent": 5},
                "forecast": {
                    "hours": [],
                    "days": [
                        {"date": "2026-10-06", "rainProbability": 5},
                        {"date": "2026-10-07", "rainProbability": 75},
                    ],
                },
            },
        },
    )

    assert response.status_code == 200
    assert "75% rain chance" in response.json()["answer"]
    assert "tomorrow" in response.json()["answer"].lower()


def test_assistant_answers_temperature_questions_without_echoing_the_question() -> None:
    question = "What is the temperature?"
    response = client.post(
        "/assistant",
        json={
            "question": question,
            "weather": {
                "location": {"label": "Kandy"},
                "current": {"temperature_c": 25, "feels_like_c": 27},
            },
        },
    )

    assert response.status_code == 200
    assert response.json()["answer"] == "In Kandy, it's currently 25°C, feeling like 27°C."
    assert question not in response.json()["answer"]


def test_assistant_is_honest_when_weather_data_is_missing() -> None:
    response = client.post(
        "/assistant",
        json={"question": "Will it rain?", "weather": {"location": {"label": "Kandy"}}},
    )

    assert response.status_code == 200
    assert "don't have current weather data" in response.json()["answer"].lower()


def test_assistant_rejects_blank_and_overlong_questions() -> None:
    blank = client.post("/assistant", json={"question": "   ", "weather": {}})
    too_long = client.post("/assistant", json={"question": "a" * 301, "weather": {}})

    assert blank.status_code == 422
    assert too_long.status_code == 422
