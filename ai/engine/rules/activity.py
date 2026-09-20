from engine.rules._common import factor, make_recommendation
from engine.rules.heat import heat_risk_level
from engine.rules.rain import rain_risk_level
from engine.rules.thunderstorm import is_thunderstorm
from engine.rules.wind import wind_risk_level
from engine.types.recommendation import Recommendation, WeatherSnapshot


def _effective_temp(weather: WeatherSnapshot) -> float:
    if weather.feels_like_c is not None:
        return weather.feels_like_c
    if weather.temperature_c is not None:
        return weather.temperature_c
    return 20.0


def activity_suitability(weather: WeatherSnapshot) -> str:
    if is_thunderstorm(weather):
        return "Avoid"

    rain = rain_risk_level(weather)
    wind = wind_risk_level(weather)
    heat = heat_risk_level(weather)
    rain_prob = weather.rain_probability_percent or 0
    wind_speed = weather.wind_speed_kmh or 0
    temp = _effective_temp(weather)
    uv = weather.uv_index or 0

    if heat == "CRITICAL" or (rain == "HIGH" and rain_prob >= 85):
        return "Avoid"
    if rain == "HIGH" or wind == "CRITICAL" or (wind == "HIGH" and wind_speed >= 45):
        return "Poor"
    if heat in {"HIGH", "CRITICAL"} or rain == "MODERATE" or wind == "HIGH" or temp >= 34 or uv >= 8:
        return "Moderate"
    if temp >= 26 or uv >= 6 or rain_prob >= 40 or wind_speed >= 15:
        return "Good"
    return "Excellent"


def activity_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    suitability = activity_suitability(weather)
    if suitability not in {"Excellent", "Good"}:
        return []

    factors = []
    if weather.temperature_c is not None:
        factors.append(factor("temperature_c", weather.temperature_c, "celsius"))
    if weather.rain_probability_percent is not None:
        factors.append(factor("rain_probability_percent", weather.rain_probability_percent, "percent"))
    if weather.wind_speed_kmh is not None:
        factors.append(factor("wind_speed_kmh", weather.wind_speed_kmh, "kmh"))

    return [
        make_recommendation(
            rec_id="activity-outdoor-01",
            category="outdoor",
            title="Outdoor activity",
            message="Conditions look suitable for outdoor activity. Follow clothing, hydration, and UV advice.",
            reason="Activity suitability is derived from heat, rain, wind, and storm risk.",
            priority="INFO",
            risk_level="SAFE",
            factors=factors or [factor("activity_suitability", suitability)],
            action="enjoy_outdoor_activity",
            encourage_outdoor=True,
        )
    ]
