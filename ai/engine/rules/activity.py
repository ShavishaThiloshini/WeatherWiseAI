from engine.categories import is_thunderstorm
from engine.categories.rain import combined_rain_category
from engine.categories.temperature import classify_temperature
from engine.categories.uv import classify_uv
from engine.categories.wind import classify_wind
from engine.rules._common import factor, make_recommendation
from engine.rules.heat import heat_risk_level
from engine.types.recommendation import Recommendation, WeatherSnapshot

ACTIVITY_SCORE = {
    "Excellent": 90,
    "Good": 75,
    "Moderate": 55,
    "Poor": 30,
    "Avoid": 0,
}


def activity_suitability(weather: WeatherSnapshot) -> str:
    if is_thunderstorm(weather.condition):
        return "Avoid"

    wind = classify_wind(weather.wind_speed_kmh, weather.wind_gust_kmh)
    rain = combined_rain_category(
        weather.rain_probability_percent,
        weather.rain_intensity,
        weather.condition,
    )
    temp = classify_temperature(weather.temperature_c)
    uv = classify_uv(weather.uv_index)
    heat = heat_risk_level(weather)

    if wind == "very_strong" or rain == "extreme_rain" or heat == "CRITICAL":
        return "Avoid"
    if rain == "heavy_rain" or temp == "very_hot" or wind == "strong":
        return "Poor"
    if heat == "HIGH" or rain == "moderate_rain" or uv in {"very_high", "extreme"}:
        return "Moderate"
    if temp in {"cold", "very_cold"} or uv == "high" or heat == "MODERATE":
        return "Good"

    comfortable = temp in {"comfortable", "cool", "warm"}
    quiet_rain = rain in {None, "no_rain", "light_rain"}
    quiet_wind = wind in {None, "calm", "light", "moderate"}
    if comfortable and quiet_rain and quiet_wind:
        return "Excellent"
    return "Good"


def activity_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    level = activity_suitability(weather)
    score = ACTIVITY_SCORE[level]
    factors = []
    if weather.temperature_c is not None:
        factors.append(factor("temperature_c", weather.temperature_c, "celsius"))
    if weather.rain_probability_percent is not None:
        factors.append(
            factor("rain_probability_percent", weather.rain_probability_percent, "percent")
        )
    if weather.wind_speed_kmh is not None:
        factors.append(factor("wind_speed_kmh", weather.wind_speed_kmh, "km/h"))
    if weather.uv_index is not None:
        factors.append(factor("uv_index", weather.uv_index, "index"))
    if weather.condition:
        factors.append(factor("condition", weather.condition))

    if level == "Avoid":
        message = "Outdoor activity should be postponed because of safety-critical weather."
        priority = "CRITICAL"
        risk = "CRITICAL"
        encourage = False
    elif level == "Poor":
        message = "Outdoor activity is a poor fit right now. Choose a lighter plan or stay indoors."
        priority = "HIGH"
        risk = "HIGH"
        encourage = False
    elif level == "Moderate":
        message = "Outdoor activity is possible with caution. Shorten intense exercise and watch conditions."
        priority = "MEDIUM"
        risk = "MODERATE"
        encourage = False
    elif level == "Good":
        message = "Outdoor activity looks reasonable. Stay aware of changing conditions."
        priority = "LOW"
        risk = "LOW"
        encourage = True
    else:
        message = "Conditions look suitable for normal outdoor activity."
        priority = "INFO"
        risk = "SAFE"
        encourage = True

    return [
        make_recommendation(
            rec_id="outdoor-activity-01",
            category="outdoor",
            title=f"Outdoor activity: {level}",
            message=message,
            reason="Suitability uses temperature, rain, wind, UV, heat/cold risk, and severe-weather overrides.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action="activity_guidance",
            score=score,
            encourage_outdoor=encourage,
        )
    ]
