from engine.rules._common import factor, make_recommendation
from engine.rules.heat import heat_risk_level
from engine.types.recommendation import Recommendation, WeatherSnapshot


def hydration_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    if weather.temperature_c is None and weather.feels_like_c is None:
        return []

    risk = heat_risk_level(weather)
    if risk == "SAFE":
        return []

    factors = []
    if weather.temperature_c is not None:
        factors.append(factor("temperature_c", weather.temperature_c, "celsius"))
    if weather.feels_like_c is not None:
        factors.append(factor("feels_like_c", weather.feels_like_c, "celsius"))
    if weather.humidity_percent is not None:
        factors.append(factor("humidity_percent", weather.humidity_percent, "percent"))
    if weather.uv_index is not None:
        factors.append(factor("uv_index", weather.uv_index, "index"))

    if risk == "CRITICAL":
        message = (
            "Drink water regularly and carry water if you go outside. "
            "This is general safety advice, not a medical instruction."
        )
        title = "Strong hydration advice"
        priority = "HIGH"
    else:
        message = "Stay hydrated, especially if you will be outdoors."
        title = "Hydration reminder"
        priority = "HIGH" if risk == "HIGH" else "MEDIUM"

    return [
        make_recommendation(
            rec_id="hydration-01",
            category="hydration",
            title=title,
            message=message,
            reason="Hydration advice follows heat risk from temperature, feels-like, humidity, and outdoor exposure.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action="drink_water",
        )
    ]
