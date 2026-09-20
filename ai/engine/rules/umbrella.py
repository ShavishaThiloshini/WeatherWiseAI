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


def _timing_phrase(timing: str | None, rain_cat: str | None) -> str:
    """Returns a time-based phrase based on the timing value."""
    if rain_cat == "no_rain":
        return "Rain unlikely during the selected period."
    if timing == "later":
        return "Rain possible later."
    if timing == "soon":
        return "Rain expected soon."
    if rain_cat in {"heavy_rain", "extreme_rain"}:
        return "Heavy rain expected during the selected period."
    return ""


def umbrella_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    probability = weather.rain_probability_percent
    rain_band = combined_rain_category(probability, weather.rain_intensity, weather.condition)
    
    if rain_band is None and probability is None and weather.rain_intensity is None and weather.condition is None:
        return []

    # Default to no_rain if band isn't matched
    if rain_band is None:
        rain_band = "no_rain"

    timing_message = _timing_phrase(weather.rain_timing, rain_band)
    
    factors = []
    if probability is not None:
        factors.append(factor("rain_probability_percent", probability, "percent"))
    if weather.rain_intensity:
        factors.append(factor("rain_intensity", weather.rain_intensity))
    if weather.rain_timing:
        factors.append(factor("rain_timing", weather.rain_timing))
    if weather.condition:
        factors.append(factor("condition", weather.condition))
        
    cond = (weather.condition or "").lower()
    is_thunderstorm = "thunder" in cond or "storm" in cond

    if is_thunderstorm or rain_band == "extreme_rain":
        title, message, priority, risk, action = (
            "Severe Weather Warning",
            f"Avoid unnecessary outdoor travel during severe rain. {timing_message}".strip(),
            "CRITICAL",
            "HIGH",
            "avoid_outdoor",
        )
    elif rain_band == "heavy_rain":
        title, message, priority, risk, action = (
            "Rain protection needed",
            f"Raincoat may be useful. {timing_message}".strip(),
            "HIGH",
            "HIGH",
            "carry_rain_protection",
        )
    elif rain_band == "moderate_rain":
        title, message, priority, risk, action = (
            "Carry an umbrella",
            f"Carry an umbrella. {timing_message}".strip(),
            "MEDIUM",
            "MODERATE",
            "carry_umbrella",
        )
    elif rain_band == "light_rain":
        title, message, priority, risk, action = (
            "Umbrella recommended",
            f"Umbrella recommended. {timing_message}".strip(),
            "LOW",
            "LOW",
            "consider_umbrella",
        )
    else:  # no_rain
        title, message, priority, risk, action = (
            "No umbrella needed",
            f"No umbrella needed. {timing_message}".strip(),
            "INFO",
            "SAFE",
            "no_action_needed",
        )

    return [
        make_recommendation(
            rec_id="umbrella-01",
            category="umbrella",
            title=title,
            message=message,
            reason="Umbrella advice uses rain probability, intensity, and timing. Severe conditions override normal umbrella advice.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action=action,
        )
    ]