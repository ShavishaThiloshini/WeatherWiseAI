from engine.categories import is_thunderstorm
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def thunderstorm_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    if not is_thunderstorm(weather.condition):
        return []
    return [
        make_recommendation(
            rec_id="thunderstorm-safety-01",
            category="outdoor",
            title="Thunderstorm safety",
            message=(
                "Thunderstorms are expected. Avoid open outdoor areas and postpone "
                "outdoor activities until the storm passes."
            ),
            reason="The reported weather condition indicates thunderstorm or storm activity.",
            priority="CRITICAL",
            risk_level="CRITICAL",
            factors=[factor("condition", weather.condition)],
            action="avoid_open_areas",
        )
    ]


def thunderstorm_alert(weather: WeatherSnapshot) -> dict | None:
    if not is_thunderstorm(weather.condition):
        return None
    return {
        "id": "alert-thunderstorm-01",
        "title": "Thunderstorm warning",
        "description": "Avoid open outdoor areas and unnecessary outdoor activity.",
        "severity": "warning",
        "category": "thunderstorm",
    }
