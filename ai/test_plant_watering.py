from engine.recommendation.engine import recommend_from_payload
from engine.rules.plant_care import plant_watering_rules
from engine.types.recommendation import WeatherSnapshot


def _plant_action(payload: dict, plant_id: str = "plant-1") -> str:
    recommendations = recommend_from_payload(payload)["recommendations"]
    plant_recommendations = [item for item in recommendations if item["category"] == "plant-care"]
    return next(item["action"] for item in plant_recommendations if item["id"] == f"plant-watering-{plant_id}")


def test_dry_hot_weather_recommends_watering_due_plant() -> None:
    payload = {
        "location": {"label": "Home"},
        "current": {
            "temperature_c": 34,
            "humidity_percent": 35,
            "rain_probability_percent": 5,
            "observed_at": "2026-09-10T12:00:00Z",
        },
        "forecast": {"hours": [], "days": []},
        "plants": [{"id": "plant-1", "name": "Tomato", "species_type": "tomato", "last_watered_at": "2026-09-08T08:00:00Z"}],
    }

    assert _plant_action(payload) == "water_now"


def test_rain_forecast_skips_watering_due_plant() -> None:
    payload = {
        "current": {"temperature_c": 24, "rain_probability_percent": 10},
        "forecast": {"hours": [], "days": [{"date": "2026-09-10", "rainProbability": 80}]},
        "plants": [{"id": "plant-1", "name": "Tomato", "last_watered_at": "2026-09-07T08:00:00Z"}],
    }

    assert _plant_action(payload) == "skip"


def test_recently_watered_plant_is_not_recommended_again() -> None:
    weather = WeatherSnapshot(
        observed_at="2026-09-10T12:00:00Z",
        plants=[{"id": "plant-1", "name": "Basil", "last_watered_at": "2026-09-10T08:00:00Z"}],
    )

    recommendation = plant_watering_rules(weather)[0]
    assert recommendation.action == "skip"
    assert recommendation.category == "plant-care"


def test_missing_watering_history_prompts_soil_check() -> None:
    weather = WeatherSnapshot(
        observed_at="2026-09-10T12:00:00Z",
        plants=[{"id": "plant-1", "name": "Monstera"}],
    )

    recommendation = plant_watering_rules(weather)[0]
    assert recommendation.action == "check_soil"
    assert "soil" in recommendation.message.lower()


def test_drought_tolerant_species_uses_longer_interval() -> None:
    weather = WeatherSnapshot(
        observed_at="2026-09-10T12:00:00Z",
        plants=[{
            "id": "plant-1",
            "name": "Aloe",
            "species_type": "succulent",
            "last_watered_at": "2026-09-07T08:00:00Z",
        }],
    )

    assert plant_watering_rules(weather)[0].action == "skip"