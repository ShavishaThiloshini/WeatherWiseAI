"""Overall Weather Risk Classification -- Day 20 AI.

Combines individual domain risk results into a single, explainable
OverallWeatherRisk result.  This module does NOT replace individual
risk rules; it aggregates them.

Risk levels (from engine.constants.thresholds.RISK_LEVELS):
    SAFE -> LOW -> MODERATE -> HIGH -> CRITICAL

Design principles
-----------------
* Safety-critical conditions (CRITICAL / HIGH) are never downgraded by a
  comfortable companion condition.
* When multiple risks are active, the combination can raise the overall
  level above any individual level.
* Missing / invalid data is handled by falling back to "SAFE" per
  domain; it never inflates the overall level beyond what valid data
  supports.
* The result is explainable: every risk that contributed is listed with
  a plain-language reason.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from engine.constants.thresholds import RISK_LEVELS
from engine.recommendation.conflict import highest_risk
from engine.rules.cold import cold_risk_level
from engine.rules.heat import heat_risk_level
from engine.rules.rain import rain_risk_level
from engine.rules.thunderstorm import is_thunderstorm
from engine.rules.uv import uv_risk_level
from engine.rules.wind import wind_risk_level
from engine.types.recommendation import Recommendation, WeatherSnapshot

# ---------------------------------------------------------------------------
# Internal risk-rank helper (re-uses RISK_LEVELS order)
# ---------------------------------------------------------------------------

_RISK_RANK: dict[str, int] = {level: index for index, level in enumerate(RISK_LEVELS)}

# Thunderstorm is treated as HIGH by default; co-active hazards handled by
# _combine_levels.
_THUNDERSTORM_BASE_RISK = "HIGH"

# Multi-hazard escalation thresholds
_MULTI_HAZARD_HIGH_THRESHOLD = 2       # >=2 HIGH-or-above -> bump combined to HIGH
_MULTI_HAZARD_CRITICAL_THRESHOLD = 2  # >=2 CRITICAL -> bump to CRITICAL


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class ActiveRisk:
    """Represents a single active weather hazard contributing to overall risk."""

    name: str
    """Human-readable hazard name, e.g. 'Thunderstorm', 'Heavy Rain'."""

    risk_level: str
    """The domain-level risk for this hazard: SAFE | LOW | MODERATE | HIGH | CRITICAL."""

    reason: str
    """Plain-language sentence explaining why this hazard is active."""

    domain: str
    """Internal domain key: heat | cold | rain | wind | uv | thunderstorm."""


@dataclass
class OverallWeatherRisk:
    """Combined overall weather-risk classification.

    Designed to be consumed by:
    - Safety and Alerts screen
    - Alerts API
    - Weather safety recommendations
    - Future personalized decision-support

    Attributes
    ----------
    risk_level:
        Overall risk level -- one of SAFE, LOW, MODERATE, HIGH, CRITICAL.
    title:
        Short heading for the Safety and Alerts screen.
    summary:
        Concise sentence summarising the combined weather situation.
    reasons:
        Plain-language list explaining which conditions drove this level.
    active_risks:
        Structured list of individual hazards that are currently active
        (risk_level >= LOW).  Individual warnings remain available here.
    recommendations:
        Deduplicated, priority-sorted list of Recommendation objects from
        the individual rule engines.  The caller (engine.py) populates this
        after deduplication so that this dataclass remains stateless.
    data_quality:
        Enum string describing data completeness:
        'complete' | 'partial' | 'minimal'.
    limitations:
        Any data-quality warnings (e.g. "temperature_missing").
    """

    risk_level: str
    title: str
    summary: str
    reasons: list[str]
    active_risks: list[ActiveRisk]
    recommendations: list[Recommendation] = field(default_factory=list)
    data_quality: str = "complete"
    limitations: list[str] = field(default_factory=list)

    def to_api(self) -> dict[str, Any]:
        """Return a JSON-serialisable dict suitable for the Alerts API."""
        return {
            "level": self.risk_level,
            "title": self.title,
            "summary": self.summary,
            "reasons": self.reasons,
            "active_risks": [
                {
                    "name": ar.name,
                    "risk_level": ar.risk_level,
                    "reason": ar.reason,
                    "domain": ar.domain,
                }
                for ar in self.active_risks
            ],
            "data_quality": self.data_quality,
            "limitations": self.limitations,
        }


# ---------------------------------------------------------------------------
# Domain-risk evaluation helpers
# ---------------------------------------------------------------------------

def _heat_active_risk(weather: WeatherSnapshot) -> ActiveRisk | None:
    level = heat_risk_level(weather)
    if _RISK_RANK.get(level, 0) < _RISK_RANK["LOW"]:
        return None
    temp = weather.temperature_c
    feels = weather.feels_like_c
    parts: list[str] = []
    if feels is not None:
        parts.append(f"feels-like {feels:.0f} C")
    elif temp is not None:
        parts.append(f"temperature {temp:.0f} C")
    if weather.humidity_percent is not None and weather.humidity_percent >= 80:
        parts.append(f"high humidity ({weather.humidity_percent:.0f} %)")
    reason = "Heat risk is elevated"
    if parts:
        reason = f"Heat risk is elevated ({', '.join(parts)})"
    return ActiveRisk(name="Heat", risk_level=level, reason=reason, domain="heat")


def _cold_active_risk(weather: WeatherSnapshot) -> ActiveRisk | None:
    level = cold_risk_level(weather)
    if _RISK_RANK.get(level, 0) < _RISK_RANK["LOW"]:
        return None
    temp = weather.temperature_c
    feels = weather.feels_like_c
    parts: list[str] = []
    if feels is not None:
        parts.append(f"feels-like {feels:.0f} C")
    elif temp is not None:
        parts.append(f"temperature {temp:.0f} C")
    if weather.wind_speed_kmh is not None and weather.wind_speed_kmh >= 40:
        parts.append(f"strong wind ({weather.wind_speed_kmh:.0f} km/h)")
    reason = "Cold weather risk is elevated"
    if parts:
        reason = f"Cold weather risk is elevated ({', '.join(parts)})"
    return ActiveRisk(name="Cold", risk_level=level, reason=reason, domain="cold")


def _rain_active_risk(weather: WeatherSnapshot) -> ActiveRisk | None:
    level = rain_risk_level(weather)
    if _RISK_RANK.get(level, 0) < _RISK_RANK["LOW"]:
        return None
    parts: list[str] = []
    if weather.rain_probability_percent is not None:
        parts.append(f"{weather.rain_probability_percent:.0f} % probability")
    if weather.rain_intensity and weather.rain_intensity not in {"none", "light"}:
        parts.append(f"{weather.rain_intensity} intensity")
    intensity = weather.rain_intensity or ""
    if level == "HIGH" or intensity in {"heavy", "extreme"}:
        name = "Heavy Rain"
        reason = "High probability or intensity of rainfall"
    else:
        name = "Rain"
        reason = "Moderate rain is likely"
    if parts:
        reason = f"{reason} ({', '.join(parts)})"
    return ActiveRisk(name=name, risk_level=level, reason=reason, domain="rain")


def _wind_active_risk(weather: WeatherSnapshot) -> ActiveRisk | None:
    level = wind_risk_level(weather)
    if _RISK_RANK.get(level, 0) < _RISK_RANK["LOW"]:
        return None
    speed = weather.wind_speed_kmh
    parts = [f"{speed:.0f} km/h"] if speed is not None else []
    name = "Very Strong Wind" if level == "CRITICAL" else "Strong Wind"
    reason_word = "Very strong" if level == "CRITICAL" else "Strong"
    reason = f"{reason_word} wind is expected"
    if parts:
        reason = f"{reason} ({', '.join(parts)})"
    return ActiveRisk(name=name, risk_level=level, reason=reason, domain="wind")


def _uv_active_risk(weather: WeatherSnapshot) -> ActiveRisk | None:
    level = uv_risk_level(weather)
    if _RISK_RANK.get(level, 0) < _RISK_RANK["LOW"]:
        return None
    uv = weather.uv_index
    parts = [f"UV index {uv:.1f}"] if uv is not None else []
    name = "Extreme UV" if level == "CRITICAL" else "High UV"
    reason_word = "Extreme" if level == "CRITICAL" else "High"
    reason = f"{reason_word} UV radiation is present"
    if parts:
        reason = f"{reason} ({', '.join(parts)})"
    return ActiveRisk(name=name, risk_level=level, reason=reason, domain="uv")


def _thunderstorm_active_risk(weather: WeatherSnapshot) -> ActiveRisk | None:
    if not is_thunderstorm(weather):
        return None
    reason = "Thunderstorm conditions are present"
    if weather.condition:
        reason = f"{reason} (condition: {weather.condition})"
    return ActiveRisk(
        name="Thunderstorm",
        risk_level=_THUNDERSTORM_BASE_RISK,
        reason=reason,
        domain="thunderstorm",
    )


# ---------------------------------------------------------------------------
# Multi-hazard escalation
# ---------------------------------------------------------------------------

def _combine_levels(active: list[ActiveRisk]) -> str:
    """Determine the overall risk level from a list of active risks.

    Rules (applied in order):
    1. Start with the single highest domain risk.
    2. If >=2 risks are CRITICAL, keep CRITICAL.
    3. If >=2 risks are HIGH or above, escalate to at least HIGH.
    4. If >=3 risks are MODERATE or above, escalate to at least MODERATE.
    5. Never downgrade below the single highest.
    """
    if not active:
        return "SAFE"

    individual_levels = [ar.risk_level for ar in active]
    base = highest_risk(*individual_levels)
    base_rank = _RISK_RANK.get(base, 0)

    critical_count = sum(
        1 for lv in individual_levels if _RISK_RANK.get(lv, 0) >= _RISK_RANK["CRITICAL"]
    )
    high_or_above_count = sum(
        1 for lv in individual_levels if _RISK_RANK.get(lv, 0) >= _RISK_RANK["HIGH"]
    )
    moderate_or_above_count = sum(
        1 for lv in individual_levels if _RISK_RANK.get(lv, 0) >= _RISK_RANK["MODERATE"]
    )

    # Rule 2
    if critical_count >= _MULTI_HAZARD_CRITICAL_THRESHOLD:
        return "CRITICAL"

    # Rule 3
    if high_or_above_count >= _MULTI_HAZARD_HIGH_THRESHOLD:
        return highest_risk(base, "HIGH")

    # Rule 4
    if moderate_or_above_count >= 3 and base_rank < _RISK_RANK["MODERATE"]:
        return "MODERATE"

    return base


# ---------------------------------------------------------------------------
# Summary / title text
# ---------------------------------------------------------------------------

_TITLE_MAP: dict[str, str] = {
    "SAFE": "Safe Weather Conditions",
    "LOW": "Low Weather Risk",
    "MODERATE": "Moderate Weather Risk",
    "HIGH": "High Weather Risk",
    "CRITICAL": "Critical Weather Risk",
}

_SUMMARY_TEMPLATES: dict[str, str] = {
    "SAFE": (
        "Weather conditions are generally suitable for normal activities. "
        "Stay aware of forecast changes."
    ),
    "LOW": (
        "Weather conditions are mostly suitable. "
        "Some minor precautions may be worthwhile."
    ),
    "MODERATE": (
        "Moderate weather risks are present. "
        "Take appropriate precautions before heading out."
    ),
    "HIGH": (
        "Significant weather hazards are present. "
        "Consider avoiding unnecessary outdoor activity and follow safety guidance."
    ),
    "CRITICAL": (
        "Severe weather conditions are currently present. "
        "Follow the recommended safety guidance and avoid unnecessary outdoor exposure."
    ),
}


def _build_summary(risk_level: str, active: list[ActiveRisk]) -> str:
    base = _SUMMARY_TEMPLATES.get(risk_level, _SUMMARY_TEMPLATES["SAFE"])
    if not active or risk_level == "SAFE":
        return base
    hazard_names = [ar.name for ar in active]
    if len(hazard_names) == 1:
        hazard_str = hazard_names[0]
    elif len(hazard_names) == 2:
        hazard_str = f"{hazard_names[0]} and {hazard_names[1]}"
    else:
        hazard_str = ", ".join(hazard_names[:-1]) + f", and {hazard_names[-1]}"
    plural = "are" if len(hazard_names) > 1 else "is"
    return f"{hazard_str} {plural} present. {base}"


# ---------------------------------------------------------------------------
# Data-quality assessment
# ---------------------------------------------------------------------------

_KEY_FIELDS = (
    "temperature_c",
    "wind_speed_kmh",
    "rain_probability_percent",
    "uv_index",
    "condition",
)


def _data_quality(weather: WeatherSnapshot) -> str:
    """Classify the data completeness of the WeatherSnapshot."""
    available = sum(1 for fname in _KEY_FIELDS if getattr(weather, fname) is not None)
    if available == len(_KEY_FIELDS):
        return "complete"
    if available >= 2:
        return "partial"
    return "minimal"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def classify_overall_risk(
    weather: WeatherSnapshot,
    *,
    limitations: list[str] | None = None,
    existing_recommendations: list[Recommendation] | None = None,
) -> OverallWeatherRisk:
    """Classify the overall weather risk from a WeatherSnapshot.

    Parameters
    ----------
    weather:
        The normalised weather data for the current observation period.
    limitations:
        Data-quality warnings already detected during snapshot parsing.
        These are forwarded into the result unchanged.
    existing_recommendations:
        The deduplicated, priority-sorted list of Recommendation objects
        already produced by the recommendation engine.  They are attached
        to the result for the Safety and Alerts screen without duplication.

    Returns
    -------
    OverallWeatherRisk
        An explainable combined classification serialisable via ``to_api()``.

    Notes
    -----
    * The function never invents weather values.
    * Missing domain data keeps that domain at "SAFE" (domain-level risk
      functions already return "SAFE" for None inputs).
    * Invalid inputs are rejected during snapshot parsing before this
      function is called.
    """
    resolved_limitations: list[str] = (
        list(limitations or []) + list(weather.limitations or [])
    )

    # Collect domain-level active risks (thunderstorm first -- safety-critical)
    domain_evaluators = [
        _thunderstorm_active_risk,
        _heat_active_risk,
        _cold_active_risk,
        _rain_active_risk,
        _wind_active_risk,
        _uv_active_risk,
    ]
    active: list[ActiveRisk] = []
    for evaluator in domain_evaluators:
        risk = evaluator(weather)
        if risk is not None:
            active.append(risk)

    risk_level = _combine_levels(active)
    reasons = (
        [ar.reason for ar in active]
        if active
        else ["No significant weather hazards detected."]
    )
    title = _TITLE_MAP.get(risk_level, "Weather Risk Assessment")
    summary = _build_summary(risk_level, active)
    quality = _data_quality(weather)

    return OverallWeatherRisk(
        risk_level=risk_level,
        title=title,
        summary=summary,
        reasons=reasons,
        active_risks=active,
        recommendations=list(existing_recommendations or []),
        data_quality=quality,
        limitations=resolved_limitations,
    )
