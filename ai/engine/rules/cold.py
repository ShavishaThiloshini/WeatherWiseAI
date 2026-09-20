from engine.constants.thresholds import TEMPERATURE_THRESHOLDS, WIND_THRESHOLDS
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def _effective_cold_c(weather: WeatherSnapshot) -> float | None:
    values = [value for value in (weather.temperature_c, weather.feels_like_c) if value is not None]
    if not values:
        return None
    return min(values)


def cold_risk_level(weather: WeatherSnapshot) -> str:
    effective = _effective_cold_c(weather)
    if effective is None:
        return "SAFE"

    thresholds = TEMPERATURE_THRESHOLDS
    windy = (
        weather.wind_speed_kmh is not None
        and weather.wind_speed_kmh >= WIND_THRESHOLDS["moderate_max"]
    )

    if effective < thresholds["very_cold_max"]:
        return "CRITICAL"
    if effective < thresholds["cold_max"]:
        return "HIGH" if windy else "MODERATE"
    if effective < thresholds["cool_max"] and windy:
        return "MODERATE"
    return "SAFE"


def cold_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    risk = cold_risk_level(weather)
    if risk in {"SAFE", "LOW"}:
        return []

    factors = []
    if weather.temperature_c is not None:
        factors.append(factor("temperature_c", weather.temperature_c, "celsius"))
    if weather.feels_like_c is not None:
        factors.append(factor("feels_like_c", weather.feels_like_c, "celsius"))
    if weather.wind_speed_kmh is not None:
        factors.append(factor("wind_speed_kmh", weather.wind_speed_kmh, "kmh"))

    return [
        make_recommendation(
            rec_id="cold-caution-01",
            category="outdoor",
            title="Cold weather caution",
            message="Cold conditions can increase chill risk. Wear warm layers and limit long outdoor exposure.",
            reason="Cold risk uses temperature and feels-like, with higher risk when wind is strong.",
            priority="HIGH" if risk in {"HIGH", "CRITICAL"} else "MEDIUM",
            risk_level=risk,
            factors=factors,
            action="dress_warmly",
        )
    ]
