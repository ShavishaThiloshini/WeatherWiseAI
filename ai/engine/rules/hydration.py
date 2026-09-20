from engine.constants.thresholds import TEMPERATURE_THRESHOLDS, UV_THRESHOLDS
from engine.rules._common import factor, make_recommendation
from engine.rules.heat import effective_heat_c, heat_risk_level
from engine.types.recommendation import Recommendation, WeatherSnapshot


def hydration_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    if weather.temperature_c is None and weather.feels_like_c is None:
        return []

    risk = heat_risk_level(weather)
    effective = effective_heat_c(weather)

    if risk in {"SAFE", "LOW"}:
        warm_enough = effective is not None and effective >= TEMPERATURE_THRESHOLDS["comfortable_max"]
        high_uv = weather.uv_index is not None and weather.uv_index >= UV_THRESHOLDS["high_max"]
        if not (warm_enough and high_uv):
            return []
        risk = "MODERATE"

    factors = []
    if effective is not None:
        factors.append(factor("effective_heat_c", effective, "celsius"))
    if weather.humidity_percent is not None:
        factors.append(factor("humidity_percent", weather.humidity_percent, "percent"))
    if weather.uv_index is not None:
        factors.append(factor("uv_index", weather.uv_index, "index"))

    if risk in {"CRITICAL", "HIGH"}:
        message = (
            "Stay hydrated. Drink water regularly and carry water for outdoor activity, "
            "especially in heat and sun."
        )
        priority = "HIGH" if risk == "HIGH" else "CRITICAL"
    else:
        message = (
            "Stay hydrated. Drink water regularly and carry water if you plan outdoor activity."
        )
        priority = "MEDIUM"

    return [
        make_recommendation(
            rec_id="hydration-heat-01",
            category="hydration",
            title="Stay hydrated",
            message=message,
            reason="Hydration guidance follows heat and UV risk using supplied weather values only.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action="drink_water",
        )
    ]
