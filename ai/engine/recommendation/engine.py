from datetime import datetime, timezone

from engine.categories import analyze_conditions
from engine.recommendation.conflict import highest_risk, resolve_conflicts
from engine.recommendation.priority import sort_recommendations
from engine.rules.activity import activity_rules, activity_suitability
from engine.rules.clothing import clothing_rules
from engine.rules.cold import cold_risk_level, cold_rules
from engine.rules.heat import heat_risk_level, heat_rules
from engine.rules.hydration import hydration_rules
from engine.rules.rain import rain_risk_level, rain_rules
from engine.rules.thunderstorm import thunderstorm_alert, thunderstorm_rules
from engine.rules.umbrella import umbrella_rules
from engine.rules.uv import uv_risk_level, uv_rules
from engine.rules.wind import wind_risk_level, wind_rules
from engine.rules._common import factor, make_recommendation
from engine.snapshot import snapshot_from_request
from engine.types.recommendation import EngineResult, RiskAssessment, WeatherSnapshot


def _risks(weather: WeatherSnapshot) -> RiskAssessment:
    heat = heat_risk_level(weather)
    cold = cold_risk_level(weather)
    rain = rain_risk_level(weather)
    wind = wind_risk_level(weather)
    uv = uv_risk_level(weather)
    outdoor = highest_risk(heat, cold, rain, wind, uv)
    travel = highest_risk(rain, wind, cold)
    overall = highest_risk(heat, cold, rain, wind, uv, outdoor, travel)
    return RiskAssessment(
        heat=heat,
        cold=cold,
        rain=rain,
        wind=wind,
        uv=uv,
        travel=travel,
        outdoor=outdoor,
        overall=overall,
    )


def _general(weather: WeatherSnapshot) -> list:
    factors = []
    if weather.temperature_c is not None:
        factors.append(factor("temperature_c", weather.temperature_c, "celsius"))
    if weather.condition:
        factors.append(factor("condition", weather.condition))
    return [
        make_recommendation(
            rec_id="general-01",
            category="general",
            title="Conditions look suitable",
            message="Conditions look suitable for normal activities. Stay aware of forecast changes.",
            reason="No high-risk rules were triggered from the supplied weather fields.",
            priority="INFO",
            risk_level="SAFE",
            factors=factors or [factor("status", "no_high_risk_rules")],
            action="normal_day",
            encourage_outdoor=True,
        )
    ]


def _summary(analysis, risks: RiskAssessment, activity: str) -> str:
    parts = []
    if analysis.thunderstorm:
        parts.append("Thunderstorm risk is present")
    if analysis.temperature:
        parts.append(f"temperature is {analysis.temperature.replace('_', ' ')}")
    if analysis.rain and analysis.rain != "no_rain":
        parts.append(f"rain is {analysis.rain.replace('_', ' ')}")
    if analysis.uv and analysis.uv not in {"low", "moderate"}:
        parts.append(f"UV is {analysis.uv.replace('_', ' ')}")
    if analysis.wind in {"strong", "very_strong"}:
        parts.append(f"wind is {analysis.wind.replace('_', ' ')}")
    if not parts:
        return f"Overall risk is {risks.overall}. Outdoor activity suitability is {activity}."
    return f"{'; '.join(parts)}. Overall risk is {risks.overall}. Outdoor activity: {activity}."


def run_engine(weather: WeatherSnapshot) -> EngineResult:
    analysis = analyze_conditions(weather)
    risks = _risks(weather)
    collected = []
    collected.extend(thunderstorm_rules(weather))
    collected.extend(heat_rules(weather))
    collected.extend(cold_rules(weather))
    collected.extend(rain_rules(weather))
    collected.extend(wind_rules(weather))
    collected.extend(uv_rules(weather))
    collected.extend(hydration_rules(weather))
    collected.extend(clothing_rules(weather))
    collected.extend(umbrella_rules(weather))
    collected.extend(activity_rules(weather))

    resolved = resolve_conflicts(collected)
    if not resolved:
        resolved = _general(weather)

    activity = activity_suitability(weather)
    alerts = []
    storm_alert = thunderstorm_alert(weather)
    if storm_alert:
        alerts.append(storm_alert)

    return EngineResult(
        recommendations=sort_recommendations(resolved),
        alerts=alerts,
        analysis=analysis,
        risks=risks,
        activity=activity,
        limitations=list(weather.limitations),
        summary=_summary(analysis, risks, activity),
        request_id=weather.request_id,
        data_freshness=weather.observed_at,
    )


def recommend_from_payload(payload: dict) -> dict:
    weather = snapshot_from_request(payload)
    result = run_engine(weather)
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "request_id": result.request_id,
        "generated_at": generated_at,
        "source": "deterministic_rules",
        "data_freshness": result.data_freshness,
        "recommendations": [item.to_api() for item in result.recommendations],
        "alerts": result.alerts,
        "analysis": {
            "temperature": result.analysis.temperature,
            "rain": result.analysis.rain,
            "wind": result.analysis.wind,
            "uv": result.analysis.uv,
            "humidity": result.analysis.humidity,
            "thunderstorm": result.analysis.thunderstorm,
            "activity": result.activity,
            "risks": {
                "heat": result.risks.heat,
                "cold": result.risks.cold,
                "rain": result.risks.rain,
                "wind": result.risks.wind,
                "uv": result.risks.uv,
                "travel": result.risks.travel,
                "outdoor": result.risks.outdoor,
                "overall": result.risks.overall,
            },
        },
        "assistant_context": {
            "summary": result.summary,
            "limitations": result.limitations,
        },
    }
