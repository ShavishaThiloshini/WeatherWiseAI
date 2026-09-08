from engine.constants.thresholds import WIND_THRESHOLDS


def classify_wind(speed_kmh: float | None, gust_kmh: float | None = None) -> str | None:
    values = [value for value in (speed_kmh, gust_kmh) if value is not None]
    if not values:
        return None
    speed = max(values)
    if speed < WIND_THRESHOLDS["calm_max"]:
        return "calm"
    if speed < WIND_THRESHOLDS["light_max"]:
        return "light"
    if speed < WIND_THRESHOLDS["moderate_max"]:
        return "moderate"
    if speed < WIND_THRESHOLDS["strong_max"]:
        return "strong"
    return "very_strong"
