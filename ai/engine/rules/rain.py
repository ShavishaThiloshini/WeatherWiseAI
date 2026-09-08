from engine.categories.rain import combined_rain_category
from engine.constants.thresholds import RAIN_PROBABILITY_THRESHOLDS
from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def rain_risk_level(weather: WeatherSnapshot) -> str:
    category = combined_rain_category(
        weather.rain_probability_percent,
        weather.rain_intensity,
        weather.condition,
    )
    if category in {"extreme_rain", "heavy_rain"}:
        return "HIGH"
    if category == "moderate_rain":
        return "MODERATE"
    if category == "light_rain":
        return "LOW"
    return "SAFE"


def _timing_phrase(timing: str | None) -> str:
    if timing == "later":
        return " later today"
    if timing == "soon":
        return " soon"
    if timing == "now":
        return " now"
    return ""


def rain_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    """Travel/outdoor rain caution. Umbrella wording lives in umbrella_rules."""
    risk = rain_risk_level(weather)
    if risk in {"SAFE", "LOW"}:
        return []

    factors = []
    if weather.rain_probability_percent is not None:
        factors.append(
            factor("rain_probability_percent", weather.rain_probability_percent, "percent")
        )
    if weather.rain_intensity:
        factors.append(factor("rain_intensity", weather.rain_intensity))
    if weather.condition:
        factors.append(factor("condition", weather.condition))

    timing = _timing_phrase(weather.rain_timing)
    if risk == "HIGH":
        message = (
            f"Heavy rain is expected{timing}. Use rain protection, take travel caution, "
            "and avoid unnecessary outdoor activities."
        )
        title = "Heavy rain warning"
        priority = "HIGH"
        category = "travel"
        action = "limit_travel"
    else:
        message = f"Rain is likely{timing}. Allow extra time if you need to travel."
        title = "Rain travel caution"
        priority = "MEDIUM"
        category = "travel"
        action = "plan_for_rain"

    return [
        make_recommendation(
            rec_id="rain-travel-01",
            category=category,
            title=title,
            message=message,
            reason="Rain risk uses probability, intensity, condition, and expected timing when available.",
            priority=priority,
            risk_level=risk,
            factors=factors,
            action=action,
        )
    ]


def should_recommend_umbrella(weather: WeatherSnapshot) -> bool:
    probability = weather.rain_probability_percent
    category = combined_rain_category(
        probability,
        weather.rain_intensity,
        weather.condition,
    )
    if category in {"moderate_rain", "heavy_rain", "extreme_rain"}:
        return True
    if probability is not None and probability >= RAIN_PROBABILITY_THRESHOLDS["moderate_max"]:
        return True
    return False
