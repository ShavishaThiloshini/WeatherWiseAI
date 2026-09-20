from engine.constants.thresholds import UV_THRESHOLDS
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def uv_risk_level(weather: WeatherSnapshot) -> str:
    uv = weather.uv_index
    if uv is None or uv < 0:
        return "SAFE"
    if uv >= UV_THRESHOLDS["very_high_max"]:
        return "CRITICAL"
    if uv >= UV_THRESHOLDS["high_max"]:
        return "HIGH"
    if uv >= UV_THRESHOLDS["moderate_max"]:
        return "MODERATE"
    return "SAFE"


def uv_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    uv = weather.uv_index
    if uv is None or uv < UV_THRESHOLDS["high_max"]:
        return []

    risk = uv_risk_level(weather)
    factors = [factor("uv_index", uv, "index")]

    if risk == "CRITICAL":
        message = (
            "Very high UV is expected. Use sunscreen, seek shade, and limit prolonged direct sun exposure."
        )
        priority = "CRITICAL"
    else:
        message = "High UV is expected. Consider sunscreen, a hat, and shade during midday hours."
        priority = "HIGH"

    return [
        make_recommendation(
            rec_id="uv-protection-01",
            category="outdoor",
            title="Sun protection",
            message=message,
            reason="UV guidance uses the supplied UV index only.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action="use_sun_protection",
        )
    ]
