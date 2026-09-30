from datetime import datetime, timezone
from typing import Any

from engine.recommendation.engine import run_engine
from engine.snapshot import snapshot_from_request
from engine.types.recommendation import EngineResult, WeatherSnapshot


def _build_primary_condition(result: EngineResult) -> str:
    """Determine the primary weather condition for the map location."""
    if result.overall_risk and result.overall_risk.active_risks:
        return result.overall_risk.active_risks[0].name

    conds = []
    if result.analysis.thunderstorm:
        return "Thunderstorm"
    if result.analysis.rain and result.analysis.rain != "no_rain":
        conds.append(result.analysis.rain.replace("_", " ").title())
    if result.analysis.wind in ["strong", "very_strong"]:
        conds.append("Strong Wind")
    if result.analysis.temperature:
        conds.append(result.analysis.temperature.replace("_", " ").title())
    if result.analysis.uv in ["high", "extreme"]:
        conds.append("High UV")

    if conds:
        return conds[0]

    return "Normal"


def _build_key_factors(weather: WeatherSnapshot) -> list[str]:
    """Extract key weather factors as human-readable strings."""
    factors = []
    if weather.temperature_c is not None:
        factors.append(f"Temperature: {weather.temperature_c:.0f}°C")
    if weather.feels_like_c is not None:
        factors.append(f"Feels Like: {weather.feels_like_c:.0f}°C")
    if weather.uv_index is not None:
        factors.append(f"UV Index: {weather.uv_index}")
    if weather.wind_speed_kmh is not None:
        factors.append(f"Wind Speed: {weather.wind_speed_kmh:.0f} km/h")
    if weather.rain_probability_percent is not None:
        factors.append(f"Rain Probability: {weather.rain_probability_percent:.0f}%")
    if weather.humidity_percent is not None:
        factors.append(f"Humidity: {weather.humidity_percent:.0f}%")
    if weather.condition:
        factors.append(f"Condition: {weather.condition}")
    return factors


def interpret_map_location(payload: dict) -> dict[str, Any]:
    """
    Generate an explainable AI interpretation for map weather data.
    """
    weather = snapshot_from_request(payload)
    result = run_engine(weather)

    overall_risk = "SAFE"
    if result.overall_risk:
        overall_risk = result.overall_risk.risk_level

    active_risks = []
    if result.overall_risk and result.overall_risk.active_risks:
        active_risks = [
            f"{ar.risk_level}_{ar.domain.upper()}" for ar in result.overall_risk.active_risks
        ]

    # Deduplicate and extract top recommendations (max 3 for map view)
    recs = []
    seen = set()
    for r in result.recommendations:
        if r.message not in seen:
            seen.add(r.message)
            recs.append(r.message)
            if len(recs) >= 3:
                break

    primary_condition = _build_primary_condition(result)

    summary = result.summary
    if result.overall_risk and result.overall_risk.summary:
        summary = result.overall_risk.summary

    return {
        "location": {
            "latitude": weather.latitude,
            "longitude": weather.longitude,
        },
        "overallRisk": overall_risk,
        "weatherSummary": summary,
        "primaryCondition": primary_condition,
        "activeRisks": active_risks,
        "keyFactors": _build_key_factors(weather),
        "recommendations": recs,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
