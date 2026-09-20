from engine.constants.thresholds import WIND_THRESHOLDS
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def wind_risk_level(weather: WeatherSnapshot) -> str:
    speed = weather.wind_speed_kmh
    if speed is None or speed < 0:
        return "SAFE"
    if speed >= WIND_THRESHOLDS["strong_max"]:
        return "CRITICAL"
    if speed >= WIND_THRESHOLDS["moderate_max"]:
        return "HIGH"
    if speed >= WIND_THRESHOLDS["light_max"]:
        return "MODERATE"
    return "SAFE"


def wind_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    risk = wind_risk_level(weather)
    if risk in {"SAFE", "LOW", "MODERATE"}:
        return []

    speed = weather.wind_speed_kmh
    factors = [factor("wind_speed_kmh", speed, "kmh")]

    if risk == "CRITICAL":
        message = "Very strong wind is expected. Avoid unnecessary outdoor exposure and travel caution."
        priority = "CRITICAL"
    else:
        message = "Strong wind is expected. Take travel and outdoor activity caution."
        priority = "HIGH"

    return [
        make_recommendation(
            rec_id="wind-caution-01",
            category="travel",
            title="Wind caution",
            message=message,
            reason="Wind risk uses supplied wind speed in km/h.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action="wind_caution",
        )
    ]
