from engine.categories.rain import combined_rain_category
from engine.categories.temperature import classify_temperature
from engine.categories.uv import classify_uv
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def clothing_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    temp_band = classify_temperature(
        weather.feels_like_c if weather.feels_like_c is not None else weather.temperature_c
    )
    if temp_band is None:
        return []

    rain_band = combined_rain_category(
        weather.rain_probability_percent,
        weather.rain_intensity,
        weather.condition,
    )
    uv_band = classify_uv(weather.uv_index)

    parts: list[str] = []
    if temp_band in {"very_cold", "cold"}:
        parts.append("Wear a warm jacket and layered clothing")
        title = "Dress warmly"
        action = "wear_warm_layers"
        priority = "HIGH" if temp_band == "very_cold" else "MEDIUM"
        risk = "HIGH" if temp_band == "very_cold" else "MODERATE"
    elif temp_band == "cool":
        parts.append("A light jacket may be useful")
        title = "Light jacket"
        action = "wear_light_jacket"
        priority = "LOW"
        risk = "LOW"
    elif temp_band in {"warm", "hot", "very_hot"}:
        parts.append("Choose lightweight, breathable clothing")
        title = "Dress for heat"
        action = "wear_light_clothing"
        priority = "MEDIUM" if temp_band != "warm" else "LOW"
        risk = "MODERATE" if temp_band in {"hot", "very_hot"} else "LOW"
    else:
        parts.append("Regular comfortable clothing is suitable")
        title = "Everyday clothing"
        action = "normal_clothing"
        priority = "INFO"
        risk = "SAFE"

    if rain_band in {"moderate_rain", "heavy_rain", "extreme_rain"}:
        parts.append("add a waterproof outer layer")
    if uv_band in {"high", "very_high", "extreme"} and temp_band not in {"cold", "very_cold"}:
        parts.append("prefer sun-protective clothing or a hat")

    if len(parts) > 1:
        extras = "; ".join(parts[1:])
        message = f"{parts[0]}. Also {extras}."
    else:
        message = f"{parts[0]}."

    factors = []
    if weather.temperature_c is not None:
        factors.append(factor("temperature_c", weather.temperature_c, "celsius"))
    if weather.feels_like_c is not None:
        factors.append(factor("feels_like_c", weather.feels_like_c, "celsius"))
    if rain_band:
        factors.append(factor("rain_category", rain_band))
    if uv_band:
        factors.append(factor("uv_category", uv_band))

    return [
        make_recommendation(
            rec_id="clothing-01",
            category="clothing",
            title=title,
            message=message[0].upper() + message[1:] if message else message,
            reason="Clothing advice combines temperature, rain, and UV without separate conflicting outfits.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action=action,
        )
    ]
