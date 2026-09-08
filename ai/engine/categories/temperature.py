from engine.constants.thresholds import TEMPERATURE_THRESHOLDS


def classify_temperature(celsius: float | None) -> str | None:
    if celsius is None:
        return None
    if celsius < TEMPERATURE_THRESHOLDS["very_cold_max"]:
        return "very_cold"
    if celsius < TEMPERATURE_THRESHOLDS["cold_max"]:
        return "cold"
    if celsius < TEMPERATURE_THRESHOLDS["cool_max"]:
        return "cool"
    if celsius < TEMPERATURE_THRESHOLDS["comfortable_max"]:
        return "comfortable"
    if celsius < TEMPERATURE_THRESHOLDS["warm_max"]:
        return "warm"
    if celsius < TEMPERATURE_THRESHOLDS["hot_max"]:
        return "hot"
    return "very_hot"
