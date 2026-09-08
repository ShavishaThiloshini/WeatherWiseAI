from engine.categories.rain import combined_rain_category
from engine.constants.thresholds import RAIN_PROBABILITY_THRESHOLDS
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def umbrella_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    probability = weather.rain_probability_percent
    intensity = weather.rain_intensity
    rain_band = combined_rain_category(probability, intensity, weather.condition)

    if rain_band is None and probability is None and intensity is None:
        return []

    if rain_band in {"no_rain", None} and (
        probability is None or probability < RAIN_PROBABILITY_THRESHOLDS["light_max"]
    ):
        return []

    timing = weather.rain_timing
    when = {
        "later": " later today",
        "soon": " soon",
        "now": " now",
    }.get(timing or "", "")

    factors = []
    if probability is not None:
        factors.append(factor("rain_probability_percent", probability, "percent"))
    if intensity:
        factors.append(factor("rain_intensity", intensity))
    if timing:
        factors.append(factor("rain_timing", timing))

    if rain_band in {"heavy_rain", "extreme_rain"} or (
        probability is not None and probability >= RAIN_PROBABILITY_THRESHOLDS["heavy_max"]
    ):
        message = f"Carry an umbrella or raincoat{when}. Rain protection is strongly recommended."
        title = "Rain protection needed"
        priority = "HIGH"
        risk = "HIGH"
        action = "carry_rain_protection"
    elif rain_band == "moderate_rain" or (
        probability is not None and probability >= RAIN_PROBABILITY_THRESHOLDS["moderate_max"]
    ):
        message = f"You may want to carry an umbrella{when}."
        title = "Carry an umbrella"
        priority = "MEDIUM"
        risk = "MODERATE"
        action = "carry_umbrella"
    elif rain_band == "light_rain":
        message = f"Consider carrying an umbrella{when}."
        title = "Umbrella optional"
        priority = "LOW"
        risk = "LOW"
        action = "consider_umbrella"
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
