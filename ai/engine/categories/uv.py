from engine.constants.thresholds import UV_THRESHOLDS


def classify_uv(uv_index: float | None) -> str | None:
    if uv_index is None:
        return None
    if uv_index < UV_THRESHOLDS["low_max"]:
        return "low"
    if uv_index < UV_THRESHOLDS["moderate_max"]:
        return "moderate"
    if uv_index < UV_THRESHOLDS["high_max"]:
        return "high"
    if uv_index < UV_THRESHOLDS["very_high_max"]:
        return "very_high"
    return "extreme"
