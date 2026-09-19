from engine.categories.rain import combined_rain_category
from engine.constants.thresholds import RAIN_PROBABILITY_THRESHOLDS
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def should_recommend_umbrella(weather: WeatherSnapshot) -> bool:
    category = combined_rain_category(
        weather.rain_probability_percent,
        weather.rain_intensity,
        weather.condition,
    )
    return category in {"moderate_rain", "heavy_rain", "extreme_rain"} or (
        weather.rain_probability_percent is not None
        and weather.rain_probability_percent >= RAIN_PROBABILITY_THRESHOLDS["moderate_max"]
    )


def umbrella_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    probability = weather.rain_probability_percent
    rain_band = combined_rain_category(probability, weather.rain_intensity, weather.condition)
    if rain_band is None and probability is None and weather.rain_intensity is None:
        return []
    if rain_band in {"no_rain", None} and (probability is None or probability < RAIN_PROBABILITY_THRESHOLDS["light_max"]):
        return []

    when = {
        "later": " later today",
        "soon": " soon",
        "now": " now",
    }.get(weather.rain_timing or "", "")
    factors = []
    if probability is not None:
        factors.append(factor("rain_probability_percent", probability, "percent"))
    if weather.rain_intensity:
        factors.append(factor("rain_intensity", weather.rain_intensity))
    if weather.rain_timing:
        factors.append(factor("rain_timing", weather.rain_timing))

    if rain_band in {"heavy_rain", "extreme_rain"} or (probability is not None and probability >= RAIN_PROBABILITY_THRESHOLDS["heavy_max"]):
        title, message, priority, risk, action = (
            "Rain protection needed",
            f"Carry an umbrella or raincoat{when}. Rain protection is strongly recommended.",
            "HIGH",
            "HIGH",
            "carry_rain_protection",
        )
    elif rain_band == "moderate_rain" or (probability is not None and probability >= RAIN_PROBABILITY_THRESHOLDS["moderate_max"]):
        title, message, priority, risk, action = (
            "Carry an umbrella",
            f"You may want to carry an umbrella{when}.",
            "MEDIUM",
            "MODERATE",
            "carry_umbrella",
        )
    elif rain_band == "light_rain":
        title, message, priority, risk, action = (
            "Umbrella optional",
            f"Consider carrying an umbrella{when}.",
            "LOW",
            "LOW",
            "consider_umbrella",
        )
    else:
        return []

    return [
        make_recommendation(
            rec_id="umbrella-01",
            category="umbrella",
            title=title,
            message=message,
            reason="Umbrella advice uses rain probability, intensity, and timing. Low probability does not create a strong warning.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action=action,
        )
    ]