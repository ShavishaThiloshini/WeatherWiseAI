from fastapi.testclient import TestClient

from app import app

client = TestClient(app)


def test_recommend_contract_has_expected_fields() -> None:
    response = client.post(
        "/recommend",
        json={
            "temperature": 36,
            "uv_index": 9,
            "rain_probability": 10,
            "wind_speed": 8,
            "condition": "clear",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert "source" in payload
    assert "recommendations" in payload
    assert isinstance(payload["recommendations"], list)
    first = payload["recommendations"][0]
    assert "category" in first
    assert "severity" in first
    assert "message" in first
    assert "reason" in first
    assert "priority" in first
    assert "risk_level" in first
    assert "factors" in first


def test_assistant_contract_has_source_and_answer() -> None:
    response = client.post(
        "/assistant",
        json={
            "question": "Should I go outside?",
            "weather": {"temperature": 31, "uv_index": 7, "condition": "sunny"},
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert "source" in payload
    assert "answer" in payload
