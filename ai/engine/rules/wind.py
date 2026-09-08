from engine.categories.wind import classify_wind
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def wind_risk_level(weather: WeatherSnapshot) -> str:
    band = classify_wind(weather.wind_speed_kmh, weather.wind_gust_kmh)
    if band == "very_strong":
        return "CRITICAL"
    if band == "strong":
        return "HIGH"
    if band == "moderate":
        return "LOW"
    return "SAFE"


def wind_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    risk = wind_risk_level(weather)
    if risk in {"SAFE", "LOW"}:
        return []

    factors = []
    if weather.wind_speed_kmh is not None:
        factors.append(factor("wind_speed_kmh", weather.wind_speed_kmh, "km/h"))
    if weather.wind_gust_kmh is not None:
        factors.append(factor("wind_gust_kmh", weather.wind_gust_kmh, "km/h"))

    if risk == "CRITICAL":
        message = (
            "Very strong wind. Avoid unnecessary outdoor exposure and take extra travel caution."
        )
        title = "High wind warning"
        priority = "CRITICAL"
    else:
        message = "Strong wind. Use caution outdoors and when travelling."
        title = "Wind caution"
        priority = "HIGH"

    return [
        make_recommendation(
            rec_id="wind-caution-01",
            category="outdoor",
            title=title,
            message=message,
            reason="Wind risk uses sustained speed and gusts when provided.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action="wind_caution",
        )
    ]
