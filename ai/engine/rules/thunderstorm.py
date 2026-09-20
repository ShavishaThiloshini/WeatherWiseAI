from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def is_thunderstorm(weather: WeatherSnapshot) -> bool:
    condition = (weather.condition or "").lower()
    return "thunder" in condition or "storm" in condition or "stormy" in condition


def thunderstorm_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    if not is_thunderstorm(weather):
        return []

    factors = []
    if weather.condition:
        factors.append(factor("condition", weather.condition))
    if weather.rain_probability_percent is not None:
        factors.append(factor("rain_probability_percent", weather.rain_probability_percent, "percent"))
    if weather.wind_speed_kmh is not None:
        factors.append(factor("wind_speed_kmh", weather.wind_speed_kmh, "kmh"))

    return [
        make_recommendation(
            rec_id="storm-outdoor-01",
            category="outdoor",
            title="Thunderstorm safety",
            message=(
                "Thunderstorm conditions are present. Avoid open areas, seek shelter, "
                "and postpone outdoor activity until conditions improve."
            ),
            reason="Storm conditions override comfort advice and force outdoor safety guidance.",
            priority="CRITICAL",
            risk_level="CRITICAL",
            factors=factors or [factor("condition", weather.condition or "thunderstorm")],
            action="avoid_outdoor_exposure",
        )
    ]


def thunderstorm_alert(weather: WeatherSnapshot) -> dict | None:
    if not is_thunderstorm(weather):
        return None
    return {
        "id": "alert-thunderstorm-01",
        "type": "thunderstorm",
        "severity": "danger",
        "title": "Thunderstorm alert",
        "message": "Thunderstorm conditions detected. Avoid unnecessary outdoor travel.",
    }
