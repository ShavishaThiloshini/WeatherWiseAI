from engine.categories.humidity import classify_humidity
from engine.categories.rain import combined_rain_category
from engine.categories.temperature import classify_temperature
from engine.categories.uv import classify_uv
from engine.categories.wind import classify_wind
from engine.types.recommendation import ConditionAnalysis, WeatherSnapshot

STORM_TOKENS = ("thunder", "storm", "stormy")


def is_thunderstorm(condition: str | None) -> bool:
    if not condition:
        return False
    text = condition.lower()
    return any(token in text for token in STORM_TOKENS)


def analyze_conditions(weather: WeatherSnapshot) -> ConditionAnalysis:
    return ConditionAnalysis(
        temperature=classify_temperature(weather.temperature_c),
        rain=combined_rain_category(
            weather.rain_probability_percent,
            weather.rain_intensity,
            weather.condition,
        ),
        wind=classify_wind(weather.wind_speed_kmh, weather.wind_gust_kmh),
        uv=classify_uv(weather.uv_index),
        humidity=classify_humidity(weather.humidity_percent),
        thunderstorm=is_thunderstorm(weather.condition),
    )
