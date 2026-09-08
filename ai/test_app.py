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


def test_assistant_works_without_gemini_key() -> None:
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
