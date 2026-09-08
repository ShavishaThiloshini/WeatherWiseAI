from engine.constants.thresholds import RAIN_INTENSITY_ORDER, RAIN_PROBABILITY_THRESHOLDS


def classify_rain_probability(percent: float | None) -> str | None:
    if percent is None:
        return None
    if percent < RAIN_PROBABILITY_THRESHOLDS["none_max"]:
        return "no_rain"
    if percent < RAIN_PROBABILITY_THRESHOLDS["light_max"]:
        return "light_rain"
    if percent < RAIN_PROBABILITY_THRESHOLDS["moderate_max"]:
        return "moderate_rain"
    if percent < RAIN_PROBABILITY_THRESHOLDS["heavy_max"]:
        return "heavy_rain"
    return "extreme_rain"


def classify_rain_intensity(intensity: str | None) -> str | None:
    if intensity is None:
        return None
    if intensity in RAIN_INTENSITY_ORDER:
        return intensity
    return None


def combined_rain_category(
    probability: float | None,
    intensity: str | None,
    condition: str | None,
) -> str | None:
    """Prefer intensity/condition when present; otherwise use probability."""
    condition_text = (condition or "").lower()
    if any(token in condition_text for token in ("heavy_rain", "torrential")):
        return "heavy_rain"
    intensity_label = classify_rain_intensity(intensity)
    if intensity_label in {"heavy", "extreme"}:
        return "extreme_rain" if intensity_label == "extreme" else "heavy_rain"
    if intensity_label == "moderate":
        return "moderate_rain"
    if intensity_label == "light":
        return "light_rain"
    if "rain" in condition_text:
        return classify_rain_probability(probability) or "moderate_rain"
    return classify_rain_probability(probability)
