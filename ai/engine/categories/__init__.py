from engine.categories.rain import combined_rain_category
from engine.types.recommendation import ConditionAnalysis, WeatherSnapshot


def analyze_conditions(weather: WeatherSnapshot) -> ConditionAnalysis:
    rain_cat = combined_rain_category(
        weather.rain_probability_percent,
        weather.rain_intensity,
        weather.condition,
    )
    
    # We don't have the implementation for other categories yet, 
    # but we need to supply them to avoid breaking tests.
    
    # Temperature band
    temp_cat = None
    if weather.temperature_c is not None:
        t = weather.temperature_c
        if t < 12:
            temp_cat = "cold"
        elif t < 18:
            temp_cat = "cool"
        elif t < 26:
            temp_cat = "comfortable"
        elif t < 32:
            temp_cat = "warm"
        else:
            temp_cat = "hot"

    # Wind band
    wind_cat = None
    if weather.wind_speed_kmh is not None and weather.wind_speed_kmh >= 0:
        w = weather.wind_speed_kmh
        if w < 12:
            wind_cat = "calm"
        elif w < 20:
            wind_cat = "light"
        elif w < 40:
            wind_cat = "moderate"
        elif w < 60:
            wind_cat = "strong"
        else:
            wind_cat = "very_strong"

    # UV band
    uv_cat = None
    if weather.uv_index is not None and weather.uv_index >= 0:
        uv = weather.uv_index
        if uv < 3:
            uv_cat = "low"
        elif uv < 6:
            uv_cat = "moderate"
        elif uv < 8:
            uv_cat = "high"
        else:
            uv_cat = "very_high"

    # Humidity band
    hum_cat = None
    if weather.humidity_percent is not None and weather.humidity_percent >= 0:
        h = weather.humidity_percent
        if h < 30:
            hum_cat = "low"
        elif h < 60:
            hum_cat = "comfortable"
        else:
            hum_cat = "high"

    # Thunderstorm
    cond = (weather.condition or "").lower()
    is_storm = "thunder" in cond or "storm" in cond

    return ConditionAnalysis(
        temperature=temp_cat,
        rain=rain_cat,
        wind=wind_cat,
        uv=uv_cat,
        humidity=hum_cat,
        thunderstorm=is_storm,
    )
