from engine.constants.thresholds import HUMIDITY_THRESHOLDS


def classify_humidity(percent: float | None) -> str | None:
    if percent is None:
        return None
    if percent < HUMIDITY_THRESHOLDS["low_max"]:
        return "low"
    if percent < HUMIDITY_THRESHOLDS["comfortable_max"]:
        return "comfortable"
    if percent < HUMIDITY_THRESHOLDS["high_max"]:
        return "high"
    return "very_high"
