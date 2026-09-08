"""Centralized weather and risk thresholds.

All rule files must import from here. Do not duplicate these numbers.
Units: temperature °C, wind km/h, rain probability %, UV WHO index, humidity %.
"""

from typing import Final

# Inclusive lower bound of each named band; the next band starts at the next value.
TEMPERATURE_THRESHOLDS: Final[dict[str, float]] = {
    "very_cold_max": 5.0,  # < 5 very cold
    "cold_max": 12.0,  # < 12 cold (Day 1 cold rule)
    "cool_max": 18.0,
    "comfortable_max": 26.0,
    "warm_max": 32.0,
    "hot_max": 37.0,  # >= 37 very hot; >= 35 is high heat risk
    "high_heat_c": 35.0,
    "high_feels_like_c": 36.0,
}

RAIN_PROBABILITY_THRESHOLDS: Final[dict[str, float]] = {
    "none_max": 20.0,
    "light_max": 40.0,
    "moderate_max": 70.0,  # Day 1 umbrella from 70
    "heavy_max": 85.0,  # Day 1 high rain severity
}

RAIN_INTENSITY_ORDER: Final[tuple[str, ...]] = (
    "none",
    "light",
    "moderate",
    "heavy",
    "extreme",
)

WIND_THRESHOLDS: Final[dict[str, float]] = {
    "calm_max": 12.0,
    "light_max": 20.0,
    "moderate_max": 40.0,  # Day 1 strong wind from 40 km/h
    "strong_max": 60.0,
}

UV_THRESHOLDS: Final[dict[str, float]] = {
    "low_max": 3.0,
    "moderate_max": 6.0,
    "high_max": 8.0,  # Day 1 UV caution from 8
    "very_high_max": 11.0,
}

HUMIDITY_THRESHOLDS: Final[dict[str, float]] = {
    "low_max": 30.0,
    "comfortable_max": 60.0,
    "high_max": 80.0,
}

RISK_LEVELS: Final[tuple[str, ...]] = ("SAFE", "LOW", "MODERATE", "HIGH", "CRITICAL")

PRIORITY_LEVELS: Final[tuple[str, ...]] = ("CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO")

ACTIVITY_LEVELS: Final[tuple[str, ...]] = (
    "Excellent",
    "Good",
    "Moderate",
    "Poor",
    "Avoid",
)

# Maps engine priority to the Day 02 API severity field.
PRIORITY_TO_SEVERITY: Final[dict[str, str]] = {
    "CRITICAL": "danger",
    "HIGH": "warning",
    "MEDIUM": "warning",
    "LOW": "info",
    "INFO": "info",
}

CANONICAL_CATEGORIES: Final[tuple[str, ...]] = (
    "clothing",
    "umbrella",
    "hydration",
    "travel",
    "outdoor",
    "plant-care",
    "general",
)

# Sort: safety first, then comfort, then convenience.
CATEGORY_TIEBREAK: Final[dict[str, int]] = {
    "outdoor": 0,
    "hydration": 1,
    "clothing": 2,
    "umbrella": 3,
    "travel": 4,
    "plant-care": 5,
    "general": 6,
}

FIELD_TO_RECOMMENDATIONS: Final[dict[str, tuple[str, ...]]] = {
    "temperature_c": ("heat", "cold", "clothing", "hydration", "outdoor"),
    "feels_like_c": ("heat", "cold", "clothing", "hydration"),
    "humidity_percent": ("heat", "hydration", "outdoor"),
    "uv_index": ("uv", "clothing", "outdoor", "hydration"),
    "rain_probability_percent": ("umbrella", "travel", "outdoor", "plant-care"),
    "rain_intensity": ("umbrella", "travel", "outdoor"),
    "wind_speed_kmh": ("wind", "cold", "outdoor", "travel"),
    "wind_gust_kmh": ("wind", "outdoor", "travel"),
    "condition": ("thunderstorm", "rain", "outdoor"),
    "visibility_km": ("travel", "outdoor"),
    "cloud_coverage_percent": ("uv",),
    "sunrise": ("uv", "outdoor"),
    "sunset": ("uv", "outdoor"),
    "observed_at": ("timing",),
    "location": ("context",),
}
