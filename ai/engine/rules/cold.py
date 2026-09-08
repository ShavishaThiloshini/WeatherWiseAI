from engine.categories.temperature import classify_temperature
from engine.categories.wind import classify_wind
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def cold_risk_level(weather: WeatherSnapshot) -> str:
    if weather.temperature_c is None and weather.feels_like_c is None:
        return "SAFE"
    temp_band = classify_temperature(
        weather.feels_like_c if weather.feels_like_c is not None else weather.temperature_c
    )
    wind_band = classify_wind(weather.wind_speed_kmh, weather.wind_gust_kmh)
    if temp_band == "very_cold":
        return "CRITICAL" if wind_band in {"strong", "very_strong"} else "HIGH"
    if temp_band == "cold":
        return "HIGH" if wind_band in {"strong", "very_strong"} else "MODERATE"
    if temp_band == "cool" and wind_band == "very_strong":
        return "MODERATE"
    return "SAFE"


def cold_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    risk = cold_risk_level(weather)
    if risk == "SAFE":
        return []

    factors = []
    if weather.temperature_c is not None:
        factors.append(factor("temperature_c", weather.temperature_c, "celsius"))
    if weather.feels_like_c is not None:
        factors.append(factor("feels_like_c", weather.feels_like_c, "celsius"))
    if weather.wind_speed_kmh is not None:
        factors.append(factor("wind_speed_kmh", weather.wind_speed_kmh, "km/h"))

    if risk in {"HIGH", "CRITICAL"}:
        message = (
            "Cold conditions. Wear warm layered clothing and limit prolonged outdoor exposure."
        )
        title = "Cold-weather warning"
        priority = "HIGH" if risk == "HIGH" else "CRITICAL"
    else:
        message = "Cool conditions today. A light jacket may be useful."
        title = "Cool-weather caution"
        priority = "MEDIUM"

    if classify_wind(weather.wind_speed_kmh, weather.wind_gust_kmh) in {"strong", "very_strong"}:
        message += " Wind makes it feel colder than the thermometer shows."

    return [
        make_recommendation(
            rec_id="cold-caution-01",
            category="outdoor",
            title=title,
            message=message,
            reason="Cold risk uses temperature or feels-like temperature, increased by strong wind.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action="wear_warm_layers",
        )
    ]
