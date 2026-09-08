"""Focused acceptance tests for the Day 3 rain recommendations."""

import pytest

from engine.categories.rain import classify_rain_probability
from engine.recommendation.engine import recommend_from_payload
from engine.snapshot import snapshot_from_request


def _recommendations(payload: dict) -> list[dict]:
    return recommend_from_payload(payload)["recommendations"]


@pytest.mark.parametrize(
    ("probability", "expected"),
    [
        (0, "no_rain"),
        (19.9, "no_rain"),
        (20, "light_rain"),
        (40, "moderate_rain"),
        (70, "heavy_rain"),
        (85, "extreme_rain"),
        (100, "extreme_rain"),
    ],
)
def test_rain_probability_thresholds(probability: float, expected: str) -> None:
    assert classify_rain_probability(probability) == expected


def test_low_rain_has_no_travel_or_umbrella_warning() -> None:
    recommendations = _recommendations(
        {"temperature": 24, "rain_probability": 10, "condition": "clear"}
    )
    categories = {item["category"] for item in recommendations}

    assert "travel" not in categories
    assert "umbrella" not in categories


def test_moderate_rain_recommends_umbrella_and_travel_planning() -> None:
    recommendations = _recommendations(
        {"temperature": 24, "rain_probability": 50, "condition": "rain"}
    )
    by_category = {item["category"]: item for item in recommendations}

    assert by_category["umbrella"]["action"] == "carry_umbrella"
    assert by_category["umbrella"]["priority"] == "MEDIUM"
    assert by_category["travel"]["action"] == "plan_for_rain"
    assert by_category["travel"]["risk_level"] == "MODERATE"


def test_heavy_intensity_overrides_a_low_probability() -> None:
    recommendations = _recommendations(
        {
            "temperature": 24,
            "rain_probability": 10,
            "rain_intensity": "heavy",
            "condition": "rain",
        }
    )
    travel = next(item for item in recommendations if item["category"] == "travel")
    umbrella = next(item for item in recommendations if item["category"] == "umbrella")

    assert travel["title"] == "Heavy rain warning"
    assert travel["priority"] == "HIGH"
    assert travel["action"] == "limit_travel"
    assert umbrella["action"] == "carry_rain_protection"


def test_forecast_rain_later_preserves_timing_in_advice() -> None:
    weather = snapshot_from_request(
        {
            "current": {"temperature_c": 26, "rain_probability_percent": 10},
            "forecast": {
                "hours": [
                    {"rain_probability_percent": 10, "condition": "clear"},
                    {"rain_probability_percent": 10, "condition": "clear"},
                    {"rain_probability_percent": 10, "condition": "clear"},
                    {
                        "rain_probability_percent": 80,
                        "rain_intensity": "moderate",
                        "condition": "rain",
                    },
                ]
            },
        }
    )
    recommendations = _recommendations(
        {
            "temperature": weather.temperature_c,
            "rain_probability": weather.rain_probability_percent,
            "rain_intensity": weather.rain_intensity,
            "condition": weather.condition,
            "rain_timing": weather.rain_timing,
        }
    )
    text = " ".join(item["message"].lower() for item in recommendations)

    assert weather.rain_timing == "later"
    assert "later today" in text
