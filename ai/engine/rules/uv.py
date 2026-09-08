from engine.categories.uv import classify_uv
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def uv_risk_level(weather: WeatherSnapshot) -> str:
    band = classify_uv(weather.uv_index)
    if band == "extreme":
        return "CRITICAL"
    if band == "very_high":
        return "HIGH"
    if band == "high":
        return "MODERATE"
    return "SAFE"


def uv_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    risk = uv_risk_level(weather)
    if risk == "SAFE":
        return []

    band = classify_uv(weather.uv_index)
    factors = [factor("uv_index", weather.uv_index, "index")]

    if risk == "CRITICAL":
        message = (
            "Extreme UV. Limit prolonged direct sun, use strong sun protection, "
            "and seek shade whenever possible."
        )
        title = "Extreme UV warning"
        priority = "HIGH"
    elif risk == "HIGH":
        message = (
            "High UV levels detected. Consider sunscreen, shade, and sun-protective clothing."
        )
        title = "High UV"
        priority = "HIGH"
    else:
        message = "UV is high enough for sunburn risk. Consider sunscreen if you will be outdoors."
        title = "Sun protection"
        priority = "MEDIUM"

    return [
        make_recommendation(
            rec_id="uv-protection-01",
            category="clothing",
            title=title,
            message=message,
            reason=f"UV index is classified as {band}.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action="use_sun_protection",
        )
    ]
