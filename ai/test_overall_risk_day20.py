"""Day 20 -- Overall Weather Risk Classification tests.

Tests cover all 10 required scenarios from the Day 20 specification,
plus safety-critical combination cases, missing/invalid data handling,
regression checks, and API output shape verification.

Run with:
    python -m pytest test_overall_risk_day20.py -v
"""
from __future__ import annotations

import pytest

from engine.recommendation.engine import recommend_from_payload, run_engine
from engine.rules.overall_risk import (
    ActiveRisk,
    OverallWeatherRisk,
    classify_overall_risk,
    _combine_levels,
    _data_quality,
)
from engine.snapshot import snapshot_from_request
from engine.types.recommendation import WeatherSnapshot

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _snap(**kwargs) -> WeatherSnapshot:
    """Build a WeatherSnapshot directly from keyword args (no parsing)."""
    return WeatherSnapshot(**kwargs)


def _overall(payload: dict) -> dict:
    """Return the overall_risk block from recommend_from_payload."""
    return recommend_from_payload(payload)["overall_risk"]


def _level(payload: dict) -> str:
    return _overall(payload)["level"]


# ---------------------------------------------------------------------------
# Scenario 1 -- Normal (comfortable) weather  ->  SAFE
# ---------------------------------------------------------------------------


class TestScenario1NormalWeather:
    PAYLOAD = {
        "temperature": 22,
        "feels_like": 22,
        "humidity": 50,
        "wind_speed": 8,
        "uv_index": 3,
        "rain_probability": 10,
        "condition": "partly_cloudy",
    }

    def test_overall_level_is_safe(self):
        assert _level(self.PAYLOAD) == "SAFE"

    def test_no_active_risks(self):
        assert _overall(self.PAYLOAD)["active_risks"] == []

    def test_title_contains_safe(self):
        assert "Safe" in _overall(self.PAYLOAD)["title"]

    def test_no_hazard_reason(self):
        reasons = _overall(self.PAYLOAD)["reasons"]
        assert len(reasons) == 1
        assert "no significant" in reasons[0].lower()

    def test_data_quality_is_complete(self):
        assert _overall(self.PAYLOAD)["data_quality"] == "complete"

    def test_overall_risk_key_present_in_full_response(self):
        result = recommend_from_payload(self.PAYLOAD)
        assert "overall_risk" in result
        assert result["overall_risk"] is not None


# ---------------------------------------------------------------------------
# Scenario 2 -- Moderate heat  ->  MODERATE or higher
# ---------------------------------------------------------------------------


class TestScenario2ModerateHeat:
    PAYLOAD = {
        "temperature": 33,
        "feels_like": 33,
        "humidity": 55,
        "wind_speed": 5,
        "uv_index": 5,
        "rain_probability": 5,
        "condition": "clear",
    }

    def test_level_at_least_moderate(self):
        from engine.constants.thresholds import RISK_LEVELS
        rank = {lv: i for i, lv in enumerate(RISK_LEVELS)}
        level = _level(self.PAYLOAD)
        assert rank[level] >= rank["MODERATE"], f"Expected >= MODERATE, got {level}"

    def test_heat_active_risk_present(self):
        domains = [ar["domain"] for ar in _overall(self.PAYLOAD)["active_risks"]]
        assert "heat" in domains

    def test_heat_reason_in_reasons(self):
        reasons = " ".join(_overall(self.PAYLOAD)["reasons"]).lower()
        assert "heat" in reasons


# ---------------------------------------------------------------------------
# Scenario 3 -- Heavy rain  ->  HIGH
# ---------------------------------------------------------------------------


class TestScenario3HeavyRain:
    PAYLOAD = {
        "temperature": 24,
        "rain_probability": 90,
        "rain_intensity": "heavy",
        "condition": "rain",
        "wind_speed": 10,
        "uv_index": 2,
    }

    def test_level_is_high(self):
        assert _level(self.PAYLOAD) == "HIGH"

    def test_rain_active_risk_present(self):
        domains = [ar["domain"] for ar in _overall(self.PAYLOAD)["active_risks"]]
        assert "rain" in domains

    def test_heavy_rain_in_active_risk_name(self):
        names = [ar["name"] for ar in _overall(self.PAYLOAD)["active_risks"]]
        assert any("rain" in name.lower() for name in names)

    def test_reason_mentions_rainfall(self):
        reasons = " ".join(_overall(self.PAYLOAD)["reasons"]).lower()
        assert "rain" in reasons


# ---------------------------------------------------------------------------
# Scenario 4 -- Extreme heat + high UV  ->  HIGH or CRITICAL
# ---------------------------------------------------------------------------


class TestScenario4ExtremeHeatHighUV:
    PAYLOAD = {
        "temperature": 37,
        "feels_like": 40,
        "humidity": 40,
        "wind_speed": 5,
        "uv_index": 10,
        "rain_probability": 5,
        "condition": "clear",
    }

    def test_level_is_high_or_critical(self):
        assert _level(self.PAYLOAD) in {"HIGH", "CRITICAL"}

    def test_heat_active_risk_present(self):
        domains = [ar["domain"] for ar in _overall(self.PAYLOAD)["active_risks"]]
        assert "heat" in domains

    def test_uv_active_risk_present(self):
        domains = [ar["domain"] for ar in _overall(self.PAYLOAD)["active_risks"]]
        assert "uv" in domains

    def test_both_hazards_listed(self):
        active = _overall(self.PAYLOAD)["active_risks"]
        assert len(active) >= 2


# ---------------------------------------------------------------------------
# Scenario 5 -- Thunderstorm  ->  HIGH (thunderstorm base)
# ---------------------------------------------------------------------------


class TestScenario5Thunderstorm:
    PAYLOAD = {
        "temperature": 24,
        "condition": "thunderstorm",
        "rain_probability": 60,
        "wind_speed": 20,
        "uv_index": 2,
    }

    def test_level_is_high_or_critical(self):
        assert _level(self.PAYLOAD) in {"HIGH", "CRITICAL"}

    def test_thunderstorm_active_risk_present(self):
        domains = [ar["domain"] for ar in _overall(self.PAYLOAD)["active_risks"]]
        assert "thunderstorm" in domains

    def test_thunderstorm_risk_level_is_high(self):
        for ar in _overall(self.PAYLOAD)["active_risks"]:
            if ar["domain"] == "thunderstorm":
                assert ar["risk_level"] == "HIGH"

    def test_summary_mentions_hazard(self):
        summary = _overall(self.PAYLOAD)["summary"].lower()
        assert "thunderstorm" in summary

    def test_comfortable_temp_does_not_produce_safe_result(self):
        # Comfortable temperature alone must NOT cause SAFE when a
        # thunderstorm is active.
        assert _level(self.PAYLOAD) != "SAFE"


# ---------------------------------------------------------------------------
# Scenario 6 -- Strong wind  ->  HIGH
# ---------------------------------------------------------------------------


class TestScenario6StrongWind:
    PAYLOAD = {
        "temperature": 22,
        "wind_speed": 45,
        "rain_probability": 5,
        "uv_index": 3,
        "condition": "windy",
    }

    def test_level_is_high(self):
        assert _level(self.PAYLOAD) == "HIGH"

    def test_wind_active_risk_present(self):
        domains = [ar["domain"] for ar in _overall(self.PAYLOAD)["active_risks"]]
        assert "wind" in domains

    def test_reason_mentions_wind(self):
        reasons = " ".join(_overall(self.PAYLOAD)["reasons"]).lower()
        assert "wind" in reasons


# ---------------------------------------------------------------------------
# Scenario 7 -- Heavy rain + strong wind  ->  HIGH (multi-hazard)
# ---------------------------------------------------------------------------


class TestScenario7HeavyRainPlusStrongWind:
    PAYLOAD = {
        "temperature": 20,
        "wind_speed": 45,
        "rain_probability": 88,
        "rain_intensity": "heavy",
        "condition": "rain",
        "uv_index": 2,
    }

    def test_level_is_high(self):
        assert _level(self.PAYLOAD) == "HIGH"

    def test_both_hazards_present(self):
        domains = {ar["domain"] for ar in _overall(self.PAYLOAD)["active_risks"]}
        assert "rain" in domains
        assert "wind" in domains

    def test_individual_risks_preserved(self):
        # Both individual hazards must still be accessible.
        active = _overall(self.PAYLOAD)["active_risks"]
        assert len(active) >= 2


# ---------------------------------------------------------------------------
# Scenario 8 -- Thunderstorm + heavy rain + strong wind  ->  HIGH / CRITICAL
# ---------------------------------------------------------------------------


class TestScenario8TripleHazard:
    PAYLOAD = {
        "temperature": 23,
        "condition": "thunderstorm",
        "rain_probability": 95,
        "rain_intensity": "heavy",
        "wind_speed": 55,
        "uv_index": 1,
    }

    def test_level_is_high_or_critical(self):
        assert _level(self.PAYLOAD) in {"HIGH", "CRITICAL"}

    def test_three_hazards_present(self):
        domains = {ar["domain"] for ar in _overall(self.PAYLOAD)["active_risks"]}
        assert "thunderstorm" in domains
        assert "rain" in domains
        assert "wind" in domains

    def test_all_reasons_listed(self):
        reasons = _overall(self.PAYLOAD)["reasons"]
        assert len(reasons) >= 3

    def test_individual_risks_not_removed(self):
        active = _overall(self.PAYLOAD)["active_risks"]
        assert len(active) >= 3


# ---------------------------------------------------------------------------
# Scenario 9 -- Cold + strong wind  ->  HIGH or CRITICAL
# ---------------------------------------------------------------------------


class TestScenario9ColdPlusStrongWind:
    PAYLOAD = {
        "temperature": 6,
        "feels_like": 1,
        "wind_speed": 42,
        "rain_probability": 10,
        "condition": "cloudy",
    }

    def test_level_is_high_or_critical(self):
        assert _level(self.PAYLOAD) in {"HIGH", "CRITICAL"}

    def test_cold_and_wind_both_present(self):
        domains = {ar["domain"] for ar in _overall(self.PAYLOAD)["active_risks"]}
        assert "cold" in domains
        assert "wind" in domains

    def test_cold_reason_present(self):
        reasons = " ".join(_overall(self.PAYLOAD)["reasons"]).lower()
        assert "cold" in reasons


# ---------------------------------------------------------------------------
# Scenario 10 -- Missing weather data
# ---------------------------------------------------------------------------


class TestScenario10MissingData:
    def test_no_crash_all_missing(self):
        weather = WeatherSnapshot()
        result = classify_overall_risk(weather)
        assert result.risk_level in {"SAFE", "LOW", "MODERATE", "HIGH", "CRITICAL"}

    def test_no_false_safe_from_empty_snapshot(self):
        # Empty snapshot should return SAFE (no data = no known hazard),
        # but must not crash.
        weather = WeatherSnapshot()
        result = classify_overall_risk(weather)
        assert result is not None
        assert result.risk_level == "SAFE"  # no data -> no active hazards

    def test_missing_temperature_does_not_invent_heat(self):
        weather = WeatherSnapshot(
            wind_speed_kmh=10,
            rain_probability_percent=15,
            uv_index=2,
            condition="clear",
        )
        result = classify_overall_risk(weather)
        domains = {ar.domain for ar in result.active_risks}
        assert "heat" not in domains
        assert "cold" not in domains

    def test_missing_wind_does_not_invent_wind(self):
        weather = WeatherSnapshot(temperature_c=22, rain_probability_percent=10)
        result = classify_overall_risk(weather)
        domains = {ar.domain for ar in result.active_risks}
        assert "wind" not in domains

    def test_missing_rain_does_not_invent_rain(self):
        weather = WeatherSnapshot(temperature_c=22, wind_speed_kmh=8)
        result = classify_overall_risk(weather)
        domains = {ar.domain for ar in result.active_risks}
        assert "rain" not in domains

    def test_missing_uv_does_not_invent_uv(self):
        weather = WeatherSnapshot(temperature_c=22)
        result = classify_overall_risk(weather)
        domains = {ar.domain for ar in result.active_risks}
        assert "uv" not in domains

    def test_partial_data_returns_valid_result(self):
        # Only temperature supplied
        weather = WeatherSnapshot(temperature_c=38)
        result = classify_overall_risk(weather)
        assert result.risk_level in {"SAFE", "LOW", "MODERATE", "HIGH", "CRITICAL"}
        assert result.data_quality in {"complete", "partial", "minimal"}

    def test_limitations_forwarded(self):
        weather = WeatherSnapshot(limitations=["temperature_missing"])
        result = classify_overall_risk(weather)
        assert "temperature_missing" in result.limitations

    def test_caller_limitations_merged(self):
        weather = WeatherSnapshot()
        result = classify_overall_risk(weather, limitations=["custom_limit"])
        assert "custom_limit" in result.limitations


# ---------------------------------------------------------------------------
# Invalid / malformed data  (snapshot layer rejects; engine remains safe)
# ---------------------------------------------------------------------------


class TestInvalidData:
    def test_negative_wind_produces_safe_wind(self):
        result = recommend_from_payload(
            {"temperature": 22, "wind_speed": -5, "condition": "clear"}
        )
        assert result["overall_risk"]["level"] in {"SAFE", "LOW"}
        domains = {ar["domain"] for ar in result["overall_risk"]["active_risks"]}
        assert "wind" not in domains

    def test_invalid_rain_probability_skipped(self):
        result = recommend_from_payload(
            {"temperature": 22, "rain_probability": -20, "condition": "clear"}
        )
        # engine must not crash and must not invent a rain risk
        assert result["overall_risk"] is not None
        domains = {ar["domain"] for ar in result["overall_risk"]["active_risks"]}
        assert "rain" not in domains

    def test_string_wind_speed_skipped(self):
        # The snapshot layer converts "abc" -> None
        result = recommend_from_payload({"temperature": 22, "wind_speed": "abc"})
        assert result["overall_risk"] is not None

    def test_null_temperature_does_not_crash(self):
        result = recommend_from_payload({"temperature": None, "wind_speed": 10})
        assert result["overall_risk"] is not None

    def test_undefined_uv_does_not_crash(self):
        result = recommend_from_payload({"temperature": 22, "uv_index": None})
        assert result["overall_risk"] is not None


# ---------------------------------------------------------------------------
# Safety-critical conditions
# ---------------------------------------------------------------------------


class TestSafetyCriticalConditions:
    def test_thunderstorm_plus_normal_temp_not_safe(self):
        level = _level(
            {"temperature": 22, "condition": "thunderstorm", "wind_speed": 15}
        )
        assert level != "SAFE"

    def test_thunderstorm_plus_heavy_rain_high_or_critical(self):
        level = _level(
            {
                "temperature": 22,
                "condition": "thunderstorm",
                "rain_probability": 90,
                "rain_intensity": "heavy",
                "wind_speed": 20,
            }
        )
        assert level in {"HIGH", "CRITICAL"}

    def test_thunderstorm_plus_strong_wind_high_or_critical(self):
        level = _level(
            {"temperature": 22, "condition": "thunderstorm", "wind_speed": 50}
        )
        assert level in {"HIGH", "CRITICAL"}

    def test_strong_wind_plus_heavy_rain_high(self):
        level = _level(
            {
                "temperature": 20,
                "wind_speed": 45,
                "rain_probability": 90,
                "rain_intensity": "heavy",
            }
        )
        assert level in {"HIGH", "CRITICAL"}

    def test_extreme_heat_plus_extreme_uv_high_or_critical(self):
        level = _level(
            {
                "temperature": 37,
                "feels_like": 40,
                "uv_index": 12,
                "wind_speed": 5,
                "rain_probability": 5,
                "condition": "clear",
            }
        )
        assert level in {"HIGH", "CRITICAL"}

    def test_extreme_cold_plus_strong_wind_high_or_critical(self):
        level = _level(
            {"temperature": 3, "feels_like": -2, "wind_speed": 50, "condition": "cloudy"}
        )
        assert level in {"HIGH", "CRITICAL"}


# ---------------------------------------------------------------------------
# Multi-hazard escalation (unit tests on _combine_levels)
# ---------------------------------------------------------------------------


class TestCombineLevels:
    def test_empty_active_is_safe(self):
        assert _combine_levels([]) == "SAFE"

    def test_single_moderate_stays_moderate(self):
        active = [ActiveRisk("Rain", "MODERATE", "reason", "rain")]
        assert _combine_levels(active) == "MODERATE"

    def test_single_high_stays_high(self):
        active = [ActiveRisk("Wind", "HIGH", "reason", "wind")]
        assert _combine_levels(active) == "HIGH"

    def test_two_high_stays_high(self):
        active = [
            ActiveRisk("Wind", "HIGH", "reason", "wind"),
            ActiveRisk("Rain", "HIGH", "reason", "rain"),
        ]
        result = _combine_levels(active)
        assert result in {"HIGH", "CRITICAL"}

    def test_two_critical_stays_critical(self):
        active = [
            ActiveRisk("Heat", "CRITICAL", "reason", "heat"),
            ActiveRisk("UV", "CRITICAL", "reason", "uv"),
        ]
        assert _combine_levels(active) == "CRITICAL"

    def test_one_high_one_moderate_is_high(self):
        active = [
            ActiveRisk("Wind", "HIGH", "reason", "wind"),
            ActiveRisk("Rain", "MODERATE", "reason", "rain"),
        ]
        assert _combine_levels(active) == "HIGH"

    def test_three_moderate_escalates_to_moderate(self):
        active = [
            ActiveRisk("Rain", "MODERATE", "r", "rain"),
            ActiveRisk("Heat", "MODERATE", "r", "heat"),
            ActiveRisk("UV", "MODERATE", "r", "uv"),
        ]
        result = _combine_levels(active)
        assert result in {"MODERATE", "HIGH", "CRITICAL"}

    def test_safe_level_not_promoted_by_low(self):
        active = [ActiveRisk("Rain", "LOW", "reason", "rain")]
        assert _combine_levels(active) == "LOW"


# ---------------------------------------------------------------------------
# Data-quality assessment
# ---------------------------------------------------------------------------


class TestDataQuality:
    def test_all_fields_complete(self):
        w = WeatherSnapshot(
            temperature_c=22,
            wind_speed_kmh=10,
            rain_probability_percent=15,
            uv_index=3,
            condition="clear",
        )
        assert _data_quality(w) == "complete"

    def test_some_fields_partial(self):
        w = WeatherSnapshot(temperature_c=22, wind_speed_kmh=10)
        assert _data_quality(w) == "partial"

    def test_one_field_minimal(self):
        w = WeatherSnapshot(temperature_c=22)
        assert _data_quality(w) == "minimal"

    def test_no_fields_minimal(self):
        w = WeatherSnapshot()
        assert _data_quality(w) == "minimal"


# ---------------------------------------------------------------------------
# OverallWeatherRisk.to_api() shape
# ---------------------------------------------------------------------------


class TestApiOutputShape:
    def test_to_api_has_required_keys(self):
        w = WeatherSnapshot(
            temperature_c=37,
            feels_like_c=40,
            uv_index=10,
            wind_speed_kmh=5,
            rain_probability_percent=5,
            condition="clear",
        )
        result = classify_overall_risk(w)
        api = result.to_api()
        for key in ("level", "title", "summary", "reasons", "active_risks", "data_quality", "limitations"):
            assert key in api, f"Missing key: {key}"

    def test_active_risks_have_required_fields(self):
        w = WeatherSnapshot(condition="thunderstorm", wind_speed_kmh=50)
        result = classify_overall_risk(w)
        api = result.to_api()
        for ar in api["active_risks"]:
            for field in ("name", "risk_level", "reason", "domain"):
                assert field in ar, f"Missing field '{field}' in active_risk"

    def test_recommend_from_payload_includes_overall_risk(self):
        result = recommend_from_payload(
            {"temperature": 22, "condition": "thunderstorm", "wind_speed": 45}
        )
        assert "overall_risk" in result
        assert result["overall_risk"]["level"] in {"HIGH", "CRITICAL"}

    def test_full_payload_overall_risk_matches_active_risks(self):
        payload = {
            "temperature": 23,
            "condition": "thunderstorm",
            "rain_probability": 90,
            "rain_intensity": "heavy",
            "wind_speed": 50,
        }
        result = recommend_from_payload(payload)
        overall = result["overall_risk"]
        assert overall["level"] in {"HIGH", "CRITICAL"}
        domains = {ar["domain"] for ar in overall["active_risks"]}
        assert "thunderstorm" in domains
        assert "rain" in domains
        assert "wind" in domains

    def test_overall_risk_does_not_replace_recommendations(self):
        result = recommend_from_payload(
            {
                "temperature": 23,
                "condition": "thunderstorm",
                "rain_probability": 90,
                "rain_intensity": "heavy",
                "wind_speed": 50,
            }
        )
        assert "recommendations" in result
        assert len(result["recommendations"]) > 0
        assert "overall_risk" in result


# ---------------------------------------------------------------------------
# Individual risk availability
# ---------------------------------------------------------------------------


class TestIndividualRisksPreserved:
    """Overall classification must not eliminate individual risk details."""

    def test_individual_risks_still_in_analysis(self):
        result = recommend_from_payload(
            {
                "temperature": 37,
                "feels_like": 40,
                "uv_index": 10,
                "wind_speed": 50,
                "rain_probability": 90,
                "rain_intensity": "heavy",
                "condition": "clear",
            }
        )
        risks = result["analysis"]["risks"]
        assert risks["heat"] in {"HIGH", "CRITICAL"}
        assert risks["uv"] in {"HIGH", "CRITICAL"}
        assert risks["wind"] in {"HIGH", "CRITICAL"}
        assert risks["rain"] in {"HIGH"}

    def test_recommendations_still_present_alongside_overall_risk(self):
        result = recommend_from_payload(
            {"temperature": 22, "condition": "thunderstorm", "wind_speed": 45}
        )
        assert result["recommendations"]
        assert result["overall_risk"]

    def test_alerts_still_generated_alongside_overall_risk(self):
        result = recommend_from_payload(
            {"temperature": 22, "condition": "thunderstorm", "wind_speed": 20}
        )
        assert result["alerts"]
        assert result["overall_risk"]


# ---------------------------------------------------------------------------
# Regression: existing AI functionality unchanged
# ---------------------------------------------------------------------------


class TestRegressionExistingAI:
    def test_heat_rules_still_fire(self):
        result = recommend_from_payload(
            {"temperature": 36, "feels_like": 38, "humidity": 70, "uv_index": 9, "condition": "clear"}
        )
        cats = {r["category"] for r in result["recommendations"]}
        assert "hydration" in cats

    def test_umbrella_rules_still_fire(self):
        result = recommend_from_payload(
            {"temperature": 24, "rain_probability": 80, "rain_intensity": "moderate"}
        )
        cats = {r["category"] for r in result["recommendations"]}
        assert "umbrella" in cats

    def test_thunderstorm_still_critical_recommendation(self):
        result = recommend_from_payload(
            {"temperature": 24, "condition": "thunderstorm", "rain_probability": 80}
        )
        first = result["recommendations"][0]
        assert first["priority"] == "CRITICAL"

    def test_cold_rules_still_fire(self):
        result = recommend_from_payload(
            {"temperature": 8, "feels_like": 4, "wind_speed": 10, "condition": "cloudy"}
        )
        text = " ".join(r["message"].lower() for r in result["recommendations"])
        assert "warm" in text or "layer" in text or "jacket" in text

    def test_wind_rules_still_fire(self):
        result = recommend_from_payload(
            {"temperature": 22, "wind_speed": 45, "condition": "windy"}
        )
        cats = {r["category"] for r in result["recommendations"]}
        assert "travel" in cats

    def test_activity_rating_still_present(self):
        result = recommend_from_payload({"temperature": 22, "wind_speed": 8, "condition": "clear"})
        assert "activity" in result["analysis"]

    def test_existing_risks_still_in_analysis(self):
        result = recommend_from_payload(
            {"temperature": 36, "uv_index": 9, "wind_speed": 45, "rain_probability": 85}
        )
        risks = result["analysis"]["risks"]
        for key in ("heat", "cold", "rain", "wind", "uv", "travel", "outdoor", "overall"):
            assert key in risks

    def test_overall_risk_field_added_without_breaking_analysis(self):
        result = recommend_from_payload({"temperature": 22})
        assert "analysis" in result
        assert "overall_risk" in result
        # Both must coexist
        assert result["analysis"]["risks"]["overall"] in {"SAFE", "LOW", "MODERATE", "HIGH", "CRITICAL"}
        assert result["overall_risk"]["level"] in {"SAFE", "LOW", "MODERATE", "HIGH", "CRITICAL"}
