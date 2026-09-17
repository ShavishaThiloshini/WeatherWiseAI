from engine.constants.thresholds import RAIN_PROBABILITY_THRESHOLDS, TEMPERATURE_THRESHOLDS, UV_THRESHOLDS
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def _temperature_advice(temperature: float) -> tuple[str, str]:
    thresholds = TEMPERATURE_THRESHOLDS
    if temperature < thresholds["very_cold_max"]:
        return "Wear a warm coat, insulating layers, and closed shoes.", "very_cold"
    if temperature < thresholds["cold_max"]:
        return "Wear a warm jacket and layered clothing with closed shoes.", "cold"
    if temperature < thresholds["cool_max"]:
        return "Bring a light jacket or cardigan and choose comfortable layers.", "cool"
    if temperature < thresholds["comfortable_max"]:
        return "Light everyday layers should be comfortable.", "comfortable"
    if temperature < thresholds["warm_max"]:
        return "Choose light, breathable clothing.", "warm"
    if temperature < thresholds["hot_max"]:
        return "Choose lightweight, breathable clothing and limit heavy layers.", "hot"
    return "Choose very lightweight, breathable clothing and avoid heavy layers.", "very_hot"


def _rain_is_meaningful(weather: WeatherSnapshot) -> bool:
    probability = weather.rain_probability_percent
    if probability is not None and probability >= RAIN_PROBABILITY_THRESHOLDS["light_max"]:
        return True
    return weather.rain_intensity in {"moderate", "heavy", "extreme"}


def clothing_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    if weather.temperature_c is None:
        return []

    temperature_message, temperature_band = _temperature_advice(weather.temperature_c)
    messages = [temperature_message]
    factors = [factor("temperature_c", weather.temperature_c, "celsius")]
    factors.append(factor("temperature_band", temperature_band))

    if weather.feels_like_c is not None:
        factors.append(factor("feels_like_c", weather.feels_like_c, "celsius"))

    if _rain_is_meaningful(weather):
        messages.append("Add a waterproof or water-resistant outer layer.")
        if weather.rain_probability_percent is not None:
            factors.append(factor("rain_probability_percent", weather.rain_probability_percent, "percent"))
        if weather.rain_intensity is not None:
            factors.append(factor("rain_intensity", weather.rain_intensity))

    is_cold = weather.temperature_c < TEMPERATURE_THRESHOLDS["cool_max"]
    if weather.uv_index is not None and weather.uv_index >= UV_THRESHOLDS["high_max"] and not is_cold:
        messages.append("Add sun protection such as a hat, sunglasses, or sunscreen.")
        factors.append(factor("uv_index", weather.uv_index, "index"))

    return [
        make_recommendation(
            rec_id="clothing-01",
            category="clothing",
            title="What to wear",
            message=" ".join(messages),
            reason="The recommendation combines the supplied temperature, rain, and UV conditions without inventing missing values.",
            priority="MEDIUM" if len(messages) > 1 else "INFO",
            risk_level="LOW" if len(messages) > 1 else "SAFE",
            factors=factors,
            action="choose_clothing",
        )
    ]