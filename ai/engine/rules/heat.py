from engine.categories.humidity import classify_humidity
from engine.categories.temperature import classify_temperature
from engine.categories.uv import classify_uv
from engine.constants.thresholds import TEMPERATURE_THRESHOLDS
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def heat_risk_level(weather: WeatherSnapshot) -> str:
    temperature = weather.temperature_c
    feels_like = weather.feels_like_c
    if temperature is None and feels_like is None:
        return "SAFE"

    temp_band = classify_temperature(temperature)
    humidity_band = classify_humidity(weather.humidity_percent)
    effective = feels_like if feels_like is not None else temperature

    if temp_band == "very_hot" or (
        effective is not None and effective >= TEMPERATURE_THRESHOLDS["hot_max"]
    ):
        return "CRITICAL" if humidity_band in {"high", "very_high"} else "HIGH"

    if temperature is not None and temperature >= TEMPERATURE_THRESHOLDS["high_heat_c"]:
        return "HIGH"

    if feels_like is not None and feels_like >= TEMPERATURE_THRESHOLDS["high_feels_like_c"]:
        return "HIGH"

    if temp_band == "hot" and humidity_band in {"high", "very_high"}:
        return "HIGH"

    if temp_band == "hot":
        return "MODERATE"

    if temp_band == "warm" and humidity_band == "very_high":
        return "MODERATE"

    return "SAFE"


def heat_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    risk = heat_risk_level(weather)
    if risk == "SAFE":
        return []

    uv_band = classify_uv(weather.uv_index)
    factors = []
    if weather.temperature_c is not None:
        factors.append(factor("temperature_c", weather.temperature_c, "celsius"))
    if weather.feels_like_c is not None:
        factors.append(factor("feels_like_c", weather.feels_like_c, "celsius"))
    if weather.humidity_percent is not None:
        factors.append(factor("humidity_percent", weather.humidity_percent, "percent"))

    if risk == "CRITICAL":
        message = (
            "Extreme heat. Stay hydrated, seek shade, take frequent breaks, "
            "and avoid intense outdoor activity."
        )
        priority = "CRITICAL"
        title = "Extreme heat warning"
    elif risk == "HIGH":
        message = (
            "It's a hot day. Stay hydrated, seek shade when you can, "
            "and avoid intense outdoor activity."
        )
        priority = "HIGH"
        title = "Heat caution"
    else:
        message = "Warm conditions may feel uncomfortable. Take breaks and drink water if you are outdoors."
        priority = "MEDIUM"
        title = "Warm-weather caution"

    if uv_band in {"high", "very_high", "extreme"}:
        message += " Use sun protection as well."
        factors.append(factor("uv_index", weather.uv_index, "index"))

    return [
        make_recommendation(
            rec_id="heat-caution-01",
            category="outdoor",
            title=title,
            message=message,
            reason="Heat risk is based on temperature, feels-like temperature, and humidity.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action="reduce_heat_exposure",
        )
    ]
