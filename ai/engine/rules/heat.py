from engine.constants.thresholds import HUMIDITY_THRESHOLDS, TEMPERATURE_THRESHOLDS
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def effective_heat_c(weather: WeatherSnapshot) -> float | None:
    values = [value for value in (weather.temperature_c, weather.feels_like_c) if value is not None]
    if not values:
        return None
    return max(values)


def heat_risk_level(weather: WeatherSnapshot) -> str:
    effective = effective_heat_c(weather)
    if effective is None:
        return "SAFE"

    thresholds = TEMPERATURE_THRESHOLDS
    high_humidity = (
        weather.humidity_percent is not None
        and weather.humidity_percent >= HUMIDITY_THRESHOLDS["high_max"]
    )

    if effective >= thresholds["hot_max"]:
        return "CRITICAL"
    if effective >= thresholds["high_heat_c"]:
        return "HIGH"
    if effective >= thresholds["warm_max"]:
        return "HIGH" if high_humidity else "MODERATE"
    if effective >= thresholds["comfortable_max"] and high_humidity:
        return "MODERATE"
    return "SAFE"


def heat_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    risk = heat_risk_level(weather)
    if risk in {"SAFE", "LOW"}:
        return []

    effective = effective_heat_c(weather)
    factors = []
    if weather.temperature_c is not None:
        factors.append(factor("temperature_c", weather.temperature_c, "celsius"))
    if weather.feels_like_c is not None:
        factors.append(factor("feels_like_c", weather.feels_like_c, "celsius"))
    if weather.humidity_percent is not None:
        factors.append(factor("humidity_percent", weather.humidity_percent, "percent"))

    if risk == "CRITICAL":
        title = "Extreme heat caution"
        message = (
            "Extreme heat is expected. Limit strenuous outdoor activity, seek shade, "
            "and follow hydration guidance."
        )
        priority = "CRITICAL"
    elif risk == "HIGH":
        title = "Heat caution"
        message = (
            "High heat is expected. Take breaks in the shade and avoid prolonged "
            "strenuous outdoor activity during peak hours."
        )
        priority = "HIGH"
    else:
        title = "Warm conditions"
        message = (
            "Warm and humid conditions can increase heat stress. "
            "Plan lighter outdoor activity and stay aware of how you feel."
        )
        priority = "MEDIUM"

    return [
        make_recommendation(
            rec_id="heat-caution-01",
            category="outdoor",
            title=title,
            message=message,
            reason=(
                "Heat risk uses the higher of temperature and feels-like, "
                "with elevated risk when humidity is high."
            ),
            priority=priority,
            risk_level=risk,
            factors=factors or [factor("effective_heat_c", effective, "celsius")],
            action="limit_heat_exposure",
        )
    ]
