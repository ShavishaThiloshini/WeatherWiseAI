"""
WeatherWise AI — Day 11 QA Testing
Clothing Recommendation Test Suite
Tester: Shavisha (Testing / QA rotation)
Date: 2026-09-20

Scope: Verify clothing recommendations are generated correctly for all
temperature ranges, weather-condition combinations, edge cases, and
missing/invalid data. Regression coverage for existing AI features.

Run with:  pytest test_clothing_day11.py -v
"""

import pytest
from engine.rules.clothing import clothing_rules, _temperature_advice, _rain_is_meaningful
from engine.types.recommendation import WeatherSnapshot, Recommendation
from engine.constants.thresholds import (
    TEMPERATURE_THRESHOLDS,
    UV_THRESHOLDS,
    RAIN_PROBABILITY_THRESHOLDS,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_snapshot(**kwargs) -> WeatherSnapshot:
    """Shortcut: build a WeatherSnapshot with only the supplied fields."""
    return WeatherSnapshot(**kwargs)


def clothing(snapshot: WeatherSnapshot) -> Recommendation | None:
    """Return the single clothing recommendation or None."""
    recs = clothing_rules(snapshot)
    assert len(recs) <= 1, "clothing_rules must return at most one recommendation"
    return recs[0] if recs else None


def clothing_from_payload(payload: dict) -> Recommendation | None:
    """Run full engine and return the clothing rec from the output."""
    from engine.recommendation.engine import recommend_from_payload
    result = recommend_from_payload(payload)
    items = [r for r in result["recommendations"] if r["category"] == "clothing"]
    assert len(items) <= 1, "Engine must not emit duplicate clothing recommendations"
    return items[0] if items else None


def factor_names(rec: dict | Recommendation) -> set[str]:
    """Return the set of factor names in a recommendation."""
    if isinstance(rec, dict):
        return {f["name"] for f in rec["factors"]}
    return {f["name"] for f in rec.factors}


# ===========================================================================
# SECTION 1 — Temperature Band Tests
# TC-CL-001 through TC-CL-006
# ===========================================================================

class TestTemperatureBands:
    """Verify every temperature range produces the correct clothing language."""

    def test_very_cold_below_5c(self):
        """TC-CL-001: Very cold (<5°C) → warm coat + insulating layers."""
        snap = make_snapshot(temperature_c=2.0)
        rec = clothing(snap)
        assert rec is not None, "Expected clothing recommendation for very cold weather"
        assert "coat" in rec.message.lower(), f"'coat' not in message: {rec.message}"
        assert rec.id == "clothing-01"
        assert rec.category == "clothing"

    def test_cold_5_to_12c(self):
        """TC-CL-002: Cold (5–12°C) → warm jacket + layers."""
        snap = make_snapshot(temperature_c=8.0)
        rec = clothing(snap)
        assert rec is not None
        assert "jacket" in rec.message.lower(), f"'jacket' not in message: {rec.message}"

    def test_cool_12_to_18c(self):
        """TC-CL-003: Cool (12–18°C) → light jacket or cardigan."""
        snap = make_snapshot(temperature_c=15.0)
        rec = clothing(snap)
        assert rec is not None
        assert "cardigan" in rec.message.lower() or "light jacket" in rec.message.lower(), \
            f"Expected 'cardigan' or 'light jacket' in: {rec.message}"

    def test_comfortable_18_to_26c(self):
        """TC-CL-004: Comfortable (18–26°C) → everyday layers."""
        snap = make_snapshot(temperature_c=22.0)
        rec = clothing(snap)
        assert rec is not None
        assert "everyday" in rec.message.lower(), f"'everyday' not in message: {rec.message}"

    def test_warm_26_to_32c(self):
        """TC-CL-005: Warm (26–32°C) → light breathable clothing."""
        snap = make_snapshot(temperature_c=29.0)
        rec = clothing(snap)
        assert rec is not None
        assert "breathable" in rec.message.lower(), f"'breathable' not in message: {rec.message}"

    def test_hot_32_to_37c(self):
        """TC-CL-005b: Hot (32–37°C) → lightweight breathable, limit heavy layers."""
        snap = make_snapshot(temperature_c=35.0)
        rec = clothing(snap)
        assert rec is not None
        assert "breathable" in rec.message.lower() or "lightweight" in rec.message.lower(), \
            f"Expected breathable/lightweight in: {rec.message}"

    def test_very_hot_37c_plus(self):
        """TC-CL-006: Very hot (≥37°C) → very lightweight, breathable."""
        snap = make_snapshot(temperature_c=38.0)
        rec = clothing(snap)
        assert rec is not None
        assert "very lightweight" in rec.message.lower(), \
            f"'very lightweight' not in message: {rec.message}"

    def test_exactly_at_very_cold_boundary_5c(self):
        """TC-CL-007 Boundary: Exactly 5°C falls into 'cold' band (not very cold)."""
        advice, band = _temperature_advice(5.0)
        assert band == "cold", f"5.0°C should be 'cold' band, got '{band}'"
        assert "jacket" in advice.lower()

    def test_exactly_at_cold_boundary_12c(self):
        """TC-CL-008 Boundary: Exactly 12°C falls into 'cool' band."""
        advice, band = _temperature_advice(12.0)
        assert band == "cool", f"12.0°C should be 'cool' band, got '{band}'"

    def test_exactly_at_comfortable_boundary_26c(self):
        """TC-CL-009 Boundary: Exactly 26°C falls into 'warm' band."""
        advice, band = _temperature_advice(26.0)
        assert band == "warm", f"26.0°C should be 'warm' band, got '{band}'"

    def test_exactly_at_warm_boundary_32c(self):
        """TC-CL-010 Boundary: Exactly 32°C falls into 'hot' band."""
        advice, band = _temperature_advice(32.0)
        assert band == "hot", f"32.0°C should be 'hot' band, got '{band}'"

    def test_exactly_at_hot_boundary_37c(self):
        """TC-CL-011 Boundary: Exactly 37°C falls into 'very hot' band."""
        advice, band = _temperature_advice(37.0)
        assert band == "very_hot", f"37.0°C should be 'very_hot' band, got '{band}'"


# ===========================================================================
# SECTION 2 — Rain Combination Tests
# TC-CL-012 through TC-CL-018
# ===========================================================================

class TestRainCombinations:
    """Verify rain conditions are correctly layered onto clothing advice."""

    def test_high_rain_probability_adds_waterproof_layer(self):
        """TC-CL-012: Rain probability ≥40% adds waterproof advice."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=75.0)
        rec = clothing(snap)
        assert rec is not None
        assert "waterproof" in rec.message.lower() or "water-resistant" in rec.message.lower(), \
            f"Expected waterproof in: {rec.message}"

    def test_low_rain_probability_no_waterproof(self):
        """TC-CL-013: Rain probability <40% does NOT add waterproof advice."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=20.0)
        rec = clothing(snap)
        assert rec is not None
        assert "waterproof" not in rec.message.lower(), \
            f"Should not mention waterproof: {rec.message}"

    def test_moderate_rain_intensity_adds_waterproof(self):
        """TC-CL-014: Moderate rain intensity triggers waterproof even with low probability."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=10.0, rain_intensity="moderate")
        rec = clothing(snap)
        assert rec is not None
        assert "waterproof" in rec.message.lower() or "water-resistant" in rec.message.lower(), \
            f"Expected waterproof with moderate intensity: {rec.message}"

    def test_heavy_rain_intensity_adds_waterproof(self):
        """TC-CL-015: Heavy rain intensity triggers waterproof layer."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=None, rain_intensity="heavy")
        rec = clothing(snap)
        assert rec is not None
        assert "waterproof" in rec.message.lower() or "water-resistant" in rec.message.lower(), \
            f"Expected waterproof with heavy intensity: {rec.message}"

    def test_hot_and_high_rain_combines_breathable_and_waterproof(self):
        """TC-CL-016: Hot + high rain → breathable clothing + waterproof outer layer."""
        snap = make_snapshot(temperature_c=33.0, rain_probability_percent=75.0, rain_intensity="moderate")
        rec = clothing(snap)
        assert rec is not None
        assert "breathable" in rec.message.lower(), f"'breathable' missing: {rec.message}"
        assert "waterproof" in rec.message.lower(), f"'waterproof' missing: {rec.message}"
        assert rec.id == "clothing-01"

    def test_cold_and_high_rain_combines_jacket_and_waterproof(self):
        """TC-CL-017: Cold + high rain → jacket/layers + waterproof."""
        snap = make_snapshot(temperature_c=8.0, rain_probability_percent=80.0)
        rec = clothing(snap)
        assert rec is not None
        assert "jacket" in rec.message.lower()
        assert "waterproof" in rec.message.lower() or "water-resistant" in rec.message.lower()

    def test_rain_probability_factor_is_included(self):
        """TC-CL-018: When rain triggers clothing advice, rain_probability_percent appears in factors."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=75.0)
        rec = clothing(snap)
        assert rec is not None
        names = factor_names(rec)
        assert "rain_probability_percent" in names, \
            f"rain_probability_percent not in factors: {names}"

    def test_rain_at_exact_threshold_40_percent(self):
        """TC-CL-019 Boundary: 40% rain probability is the minimum for 'meaningful' rain."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=40.0)
        rec = clothing(snap)
        assert rec is not None
        assert "waterproof" in rec.message.lower() or "water-resistant" in rec.message.lower(), \
            f"40% should trigger waterproof: {rec.message}"

    def test_rain_just_below_threshold_39_percent(self):
        """TC-CL-020 Boundary: 39% rain probability → NO waterproof layer added (light_max is 40)."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=39.0)
        rec = clothing(snap)
        assert rec is not None
        assert "waterproof" not in rec.message.lower(), \
            f"39% should not trigger waterproof: {rec.message}"


# ===========================================================================
# SECTION 3 — UV Combination Tests
# TC-CL-021 through TC-CL-026
# ===========================================================================

class TestUVCombinations:
    """Verify UV index correctly adds or suppresses sun protection advice."""

    def test_high_uv_with_comfortable_temp_adds_sun_protection(self):
        """TC-CL-021: UV ≥8 + comfortable temp → sun protection added."""
        snap = make_snapshot(temperature_c=24.0, uv_index=8.0)
        rec = clothing(snap)
        assert rec is not None
        assert "sun protection" in rec.message.lower(), \
            f"Expected 'sun protection' in: {rec.message}"

    def test_very_high_uv_with_warm_temp_adds_sun_protection(self):
        """TC-CL-022: UV 11 + warm temperature → sun protection included."""
        snap = make_snapshot(temperature_c=29.0, uv_index=11.0)
        rec = clothing(snap)
        assert rec is not None
        assert "sun protection" in rec.message.lower() or "hat" in rec.message.lower(), \
            f"Expected sun protection: {rec.message}"

    def test_high_uv_with_cold_temp_suppresses_sun_protection(self):
        """TC-CL-023: UV 11 + cold temp → NO sun protection (avoiding conflicting advice)."""
        snap = make_snapshot(temperature_c=8.0, uv_index=11.0)
        rec = clothing(snap)
        assert rec is not None
        assert "sun protection" not in rec.message.lower(), \
            f"Cold day should suppress sun protection: {rec.message}"

    def test_high_uv_with_very_cold_temp_suppresses_sun_protection(self):
        """TC-CL-024: UV 11 + very cold temp (<5°C) → NO sun protection."""
        snap = make_snapshot(temperature_c=2.0, uv_index=11.0)
        rec = clothing(snap)
        assert rec is not None
        assert "sun protection" not in rec.message.lower(), \
            f"Very cold day should suppress sun protection: {rec.message}"

    def test_moderate_uv_does_not_add_sun_protection_in_clothing(self):
        """TC-CL-025: UV 5 (below high threshold of 8) → no sun protection in clothing."""
        snap = make_snapshot(temperature_c=24.0, uv_index=5.0)
        rec = clothing(snap)
        assert rec is not None
        # UV < 8 should not add sun protection from clothing rule
        assert "sun protection" not in rec.message.lower(), \
            f"Moderate UV should not add sun protection: {rec.message}"

    def test_uv_at_high_threshold_8_adds_protection(self):
        """TC-CL-026 Boundary: UV exactly 8 (high_max threshold) + non-cold → sun protection added."""
        snap = make_snapshot(temperature_c=24.0, uv_index=8.0)
        rec = clothing(snap)
        assert rec is not None
        assert "sun protection" in rec.message.lower(), \
            f"UV=8 should trigger sun protection: {rec.message}"

    def test_uv_just_below_threshold_7_no_protection(self):
        """TC-CL-027 Boundary: UV 7.9 (just below threshold) → no sun protection from clothing."""
        snap = make_snapshot(temperature_c=24.0, uv_index=7.9)
        rec = clothing(snap)
        assert rec is not None
        assert "sun protection" not in rec.message.lower(), \
            f"UV=7.9 should not trigger sun protection: {rec.message}"

    def test_uv_factor_included_when_protection_added(self):
        """TC-CL-028: When UV adds sun protection, uv_index appears in factors."""
        snap = make_snapshot(temperature_c=24.0, uv_index=9.0)
        rec = clothing(snap)
        assert rec is not None
        names = factor_names(rec)
        assert "uv_index" in names, f"uv_index not in factors: {names}"


# ===========================================================================
# SECTION 4 — Combination Scenario Tests
# TC-CL-029 through TC-CL-040
# ===========================================================================

class TestCombinationScenarios:
    """Verify multi-condition weather combinations produce correct recommendations."""

    def test_cold_low_rain_probability(self):
        """TC-CL-029: Cold (8°C) + low rain (15%) → jacket, no waterproof."""
        snap = make_snapshot(temperature_c=8.0, rain_probability_percent=15.0)
        rec = clothing(snap)
        assert rec is not None
        assert "jacket" in rec.message.lower()
        assert "waterproof" not in rec.message.lower()

    def test_hot_high_uv(self):
        """TC-CL-030: Hot (35°C) + high UV (10) → lightweight + sun protection."""
        snap = make_snapshot(temperature_c=35.0, uv_index=10.0)
        rec = clothing(snap)
        assert rec is not None
        assert "breathable" in rec.message.lower() or "lightweight" in rec.message.lower()
        assert "sun protection" in rec.message.lower()

    def test_hot_high_humidity(self):
        """TC-CL-031: Hot (33°C) + high humidity (85%) → breathable clothing."""
        snap = make_snapshot(temperature_c=33.0, humidity_percent=85.0)
        rec = clothing(snap)
        assert rec is not None
        assert "breathable" in rec.message.lower(), f"Expected breathable: {rec.message}"

    def test_heavy_rain_moderate_temperature(self):
        """TC-CL-032: Heavy rain + 24°C → everyday clothing + waterproof outer layer."""
        snap = make_snapshot(
            temperature_c=24.0,
            rain_probability_percent=90.0,
            rain_intensity="heavy",
        )
        rec = clothing(snap)
        assert rec is not None
        assert "waterproof" in rec.message.lower()
        assert "everyday" in rec.message.lower() or "layer" in rec.message.lower() or \
               "comfortable" in rec.message.lower() or "light" in rec.message.lower()

    def test_strong_wind_cold_temperature(self):
        """TC-CL-033: Strong wind (50 km/h) + cold (6°C) → coat/jacket recommendation."""
        snap = make_snapshot(temperature_c=6.0, wind_speed_kmh=50.0, feels_like_c=1.0)
        rec = clothing(snap)
        assert rec is not None
        # The clothing rule fires on temperature band; cold should produce jacket/coat
        assert "jacket" in rec.message.lower() or "coat" in rec.message.lower()
        # feels_like_c should be present in factors
        names = factor_names(rec)
        assert "feels_like_c" in names, f"feels_like_c not in factors: {names}"

    def test_comfortable_temperature_low_uv(self):
        """TC-CL-034: Comfortable (22°C) + low UV (2) → simple everyday clothing, no special advice."""
        snap = make_snapshot(temperature_c=22.0, uv_index=2.0, rain_probability_percent=5.0)
        rec = clothing(snap)
        assert rec is not None
        assert "everyday" in rec.message.lower()
        assert "waterproof" not in rec.message.lower()
        assert "sun protection" not in rec.message.lower()

    def test_hot_high_uv_low_rain(self):
        """TC-CL-035: Hot (36°C) + high UV (9) + low rain (10%) → breathable + sun protection, no waterproof."""
        snap = make_snapshot(temperature_c=36.0, uv_index=9.0, rain_probability_percent=10.0)
        rec = clothing(snap)
        assert rec is not None
        assert "breathable" in rec.message.lower() or "lightweight" in rec.message.lower()
        assert "sun protection" in rec.message.lower()
        assert "waterproof" not in rec.message.lower()

    def test_very_cold_plus_rain_and_wind(self):
        """TC-CL-036: Very cold (3°C) + rain + wind → coat mentioned, waterproof added."""
        snap = make_snapshot(
            temperature_c=3.0,
            rain_probability_percent=70.0,
            wind_speed_kmh=35.0,
        )
        rec = clothing(snap)
        assert rec is not None
        assert "coat" in rec.message.lower()
        assert "waterproof" in rec.message.lower()

    def test_triple_combination_hot_uv_rain(self):
        """TC-CL-037: Hot (33°C) + high UV (8) + high rain (75%) → breathable + waterproof + sun protection."""
        snap = make_snapshot(temperature_c=33.0, uv_index=8.0, rain_probability_percent=75.0)
        rec = clothing(snap)
        assert rec is not None
        assert "breathable" in rec.message.lower() or "lightweight" in rec.message.lower()
        assert "waterproof" in rec.message.lower()
        assert "sun protection" in rec.message.lower()

    def test_feels_like_present_in_factors_when_provided(self):
        """TC-CL-038: When feels_like_c is supplied it must appear in the clothing factors."""
        snap = make_snapshot(temperature_c=30.0, feels_like_c=36.0)
        rec = clothing(snap)
        assert rec is not None
        names = factor_names(rec)
        assert "feels_like_c" in names, f"feels_like_c missing from factors: {names}"

    def test_temperature_band_factor_always_present(self):
        """TC-CL-039: temperature_band must always be present in factors."""
        for temp in [2.0, 8.0, 15.0, 22.0, 29.0, 35.0, 38.0]:
            snap = make_snapshot(temperature_c=temp)
            rec = clothing(snap)
            assert rec is not None
            names = factor_names(rec)
            assert "temperature_band" in names, \
                f"temperature_band missing at {temp}°C, factors: {names}"

    def test_temperature_c_factor_always_present(self):
        """TC-CL-040: temperature_c must always be present in factors."""
        snap = make_snapshot(temperature_c=22.0)
        rec = clothing(snap)
        assert rec is not None
        names = factor_names(rec)
        assert "temperature_c" in names, f"temperature_c missing from factors: {names}"


# ===========================================================================
# SECTION 5 — Priority and Risk Level Tests
# TC-CL-041 through TC-CL-048
# ===========================================================================

class TestPriorityAndRisk:
    """Verify priority and risk_level reflect the number of triggered conditions."""

    def test_single_condition_priority_is_info(self):
        """TC-CL-041: Temperature only (no rain/UV) → priority=INFO, risk_level=SAFE."""
        snap = make_snapshot(temperature_c=22.0)
        rec = clothing(snap)
        assert rec is not None
        assert rec.priority == "INFO", f"Expected INFO, got {rec.priority}"
        assert rec.risk_level == "SAFE", f"Expected SAFE, got {rec.risk_level}"

    def test_multi_condition_priority_is_medium(self):
        """TC-CL-042: Temperature + rain → priority=MEDIUM, risk_level=LOW."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=75.0)
        rec = clothing(snap)
        assert rec is not None
        assert rec.priority == "MEDIUM", f"Expected MEDIUM, got {rec.priority}"
        assert rec.risk_level == "LOW", f"Expected LOW, got {rec.risk_level}"

    def test_uv_adds_to_priority_escalation(self):
        """TC-CL-043: Temperature + UV → priority=MEDIUM, risk_level=LOW."""
        snap = make_snapshot(temperature_c=24.0, uv_index=9.0)
        rec = clothing(snap)
        assert rec is not None
        assert rec.priority == "MEDIUM"
        assert rec.risk_level == "LOW"

    def test_all_three_conditions_medium_priority(self):
        """TC-CL-044: Temperature + rain + UV → priority=MEDIUM, risk_level=LOW."""
        snap = make_snapshot(temperature_c=33.0, uv_index=8.0, rain_probability_percent=75.0)
        rec = clothing(snap)
        assert rec is not None
        assert rec.priority == "MEDIUM"
        assert rec.risk_level == "LOW"

    def test_severity_consistent_with_priority(self):
        """TC-CL-045: severity must map correctly from priority (MEDIUM→warning, INFO→info)."""
        snap_single = make_snapshot(temperature_c=22.0)
        snap_multi = make_snapshot(temperature_c=22.0, rain_probability_percent=75.0)
        rec_single = clothing(snap_single)
        rec_multi = clothing(snap_multi)
        assert rec_single.severity == "info", f"Expected info, got {rec_single.severity}"
        assert rec_multi.severity == "warning", f"Expected warning, got {rec_multi.severity}"

    def test_id_always_clothing_01(self):
        """TC-CL-046: The recommendation id must always be 'clothing-01'."""
        for temp in [2.0, 15.0, 22.0, 33.0, 38.0]:
            snap = make_snapshot(temperature_c=temp)
            rec = clothing(snap)
            assert rec is not None
            assert rec.id == "clothing-01", f"Expected 'clothing-01', got '{rec.id}' at {temp}°C"

    def test_category_always_clothing(self):
        """TC-CL-047: category must always be 'clothing'."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=75.0)
        rec = clothing(snap)
        assert rec is not None
        assert rec.category == "clothing"

    def test_action_always_choose_clothing(self):
        """TC-CL-048: action must always be 'choose_clothing'."""
        snap = make_snapshot(temperature_c=22.0)
        rec = clothing(snap)
        assert rec is not None
        assert rec.action == "choose_clothing"


# ===========================================================================
# SECTION 6 — Missing / Invalid Data Edge Cases
# TC-CL-049 through TC-CL-059
# ===========================================================================

class TestMissingAndInvalidData:
    """Verify graceful handling of missing or invalid weather inputs."""

    def test_missing_temperature_returns_no_recommendation(self):
        """TC-CL-049: temperature_c=None → empty list (no clothing rec generated)."""
        snap = make_snapshot(temperature_c=None)
        recs = clothing_rules(snap)
        assert recs == [], f"Expected empty list, got: {recs}"

    def test_missing_temperature_with_uv_returns_no_clothing(self):
        """TC-CL-050: No temperature + high UV → no clothing rec (can't guess temperature band)."""
        snap = make_snapshot(uv_index=11.0, rain_probability_percent=90.0)
        recs = clothing_rules(snap)
        assert recs == [], "Clothing should not fire without temperature"

    def test_missing_temperature_with_rain_returns_no_clothing(self):
        """TC-CL-051: No temperature + high rain → no clothing rec."""
        snap = make_snapshot(rain_probability_percent=95.0, rain_intensity="heavy")
        recs = clothing_rules(snap)
        assert recs == [], "Clothing should not fire without temperature"

    def test_none_uv_skips_sun_protection(self):
        """TC-CL-052: uv_index=None → no sun protection added to clothing."""
        snap = make_snapshot(temperature_c=28.0, uv_index=None)
        rec = clothing(snap)
        assert rec is not None
        assert "sun protection" not in rec.message.lower()

    def test_none_rain_probability_without_intensity_skips_waterproof(self):
        """TC-CL-053: rain_probability_percent=None + no intensity → no waterproof."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=None, rain_intensity=None)
        rec = clothing(snap)
        assert rec is not None
        assert "waterproof" not in rec.message.lower()

    def test_zero_uv_skips_sun_protection(self):
        """TC-CL-054: uv_index=0 → no sun protection."""
        snap = make_snapshot(temperature_c=24.0, uv_index=0.0)
        rec = clothing(snap)
        assert rec is not None
        assert "sun protection" not in rec.message.lower()

    def test_zero_rain_probability_skips_waterproof(self):
        """TC-CL-055: rain_probability_percent=0 → no waterproof."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=0.0)
        rec = clothing(snap)
        assert rec is not None
        assert "waterproof" not in rec.message.lower()

    def test_missing_weather_condition_still_generates_clothing(self):
        """TC-CL-056: condition=None → clothing still fires based on temperature."""
        snap = make_snapshot(temperature_c=22.0, condition=None)
        rec = clothing(snap)
        assert rec is not None
        assert "everyday" in rec.message.lower()

    def test_missing_humidity_still_generates_clothing(self):
        """TC-CL-057: humidity=None → clothing based on temperature only."""
        snap = make_snapshot(temperature_c=29.0, humidity_percent=None)
        rec = clothing(snap)
        assert rec is not None
        assert "breathable" in rec.message.lower()

    def test_missing_wind_still_generates_clothing(self):
        """TC-CL-058: wind_speed_kmh=None → clothing still fires from temperature."""
        snap = make_snapshot(temperature_c=22.0, wind_speed_kmh=None)
        rec = clothing(snap)
        assert rec is not None

    def test_missing_temperature_in_full_engine_skips_clothing(self):
        """TC-CL-059: Running full engine with no temperature → clothing absent from output."""
        from engine.recommendation.engine import run_engine
        from engine.snapshot import snapshot_from_request
        weather = snapshot_from_request(
            {"current": {"observed_at": "2026-09-08T08:00:00Z", "uv_index": 9, "condition": "clear"}}
        )
        result = run_engine(weather)
        categories_found = {item.category for item in result.recommendations}
        assert "clothing" not in categories_found, \
            "Clothing should not appear when temperature is missing"


# ===========================================================================
# SECTION 7 — Extreme Temperature Tests
# TC-CL-060 through TC-CL-064
# ===========================================================================

class TestExtremeTemperatures:
    """Verify extreme temperature values are handled without crashes."""

    def test_extremely_cold_minus_40c(self):
        """TC-CL-060: -40°C → very cold band, coat recommendation, no crash."""
        snap = make_snapshot(temperature_c=-40.0)
        rec = clothing(snap)
        assert rec is not None
        assert "coat" in rec.message.lower()

    def test_extremely_hot_50c(self):
        """TC-CL-061: 50°C → very hot band, very lightweight recommendation."""
        snap = make_snapshot(temperature_c=50.0)
        rec = clothing(snap)
        assert rec is not None
        assert "very lightweight" in rec.message.lower()

    def test_exactly_zero_celsius(self):
        """TC-CL-062: 0°C → very cold band, coat recommendation."""
        snap = make_snapshot(temperature_c=0.0)
        rec = clothing(snap)
        assert rec is not None
        assert "coat" in rec.message.lower()

    def test_negative_temperature_minus_10c(self):
        """TC-CL-063: -10°C → very cold band, coat + insulating layers."""
        snap = make_snapshot(temperature_c=-10.0)
        rec = clothing(snap)
        assert rec is not None
        assert "coat" in rec.message.lower()

    def test_extreme_values_do_not_crash_clothing_rules(self):
        """TC-CL-064: System stability — extreme values must not raise exceptions."""
        extreme_cases = [
            make_snapshot(temperature_c=100.0),
            make_snapshot(temperature_c=-100.0),
            make_snapshot(temperature_c=22.0, uv_index=50.0),
            make_snapshot(temperature_c=22.0, rain_probability_percent=100.0),
        ]
        for snap in extreme_cases:
            try:
                recs = clothing_rules(snap)
                assert isinstance(recs, list)
            except Exception as e:
                pytest.fail(f"clothing_rules raised exception for {snap}: {e}")


# ===========================================================================
# SECTION 8 — No Duplicate / No Contradictory Recommendations
# TC-CL-065 through TC-CL-069
# ===========================================================================

class TestNoDuplicatesOrContradictions:
    """Verify clothing produces exactly one recommendation with no contradictions."""

    def test_clothing_rules_returns_at_most_one_recommendation(self):
        """TC-CL-065: clothing_rules must never return more than one recommendation."""
        test_cases = [
            make_snapshot(temperature_c=22.0),
            make_snapshot(temperature_c=8.0, rain_probability_percent=80.0),
            make_snapshot(temperature_c=33.0, uv_index=9.0, rain_probability_percent=75.0),
            make_snapshot(temperature_c=2.0, uv_index=11.0),
        ]
        for snap in test_cases:
            recs = clothing_rules(snap)
            assert len(recs) <= 1, \
                f"clothing_rules returned {len(recs)} recs for {snap}, expected ≤1"

    def test_no_sun_protection_on_cold_rainy_day(self):
        """TC-CL-066: Cold + rain → no sun protection (contradictory advice suppressed)."""
        snap = make_snapshot(temperature_c=8.0, uv_index=11.0, rain_probability_percent=80.0)
        rec = clothing(snap)
        assert rec is not None
        assert "sun protection" not in rec.message.lower(), \
            f"Sun protection should be suppressed on cold day: {rec.message}"

    def test_full_engine_no_duplicate_clothing_category(self):
        """TC-CL-067: Full engine output must not contain duplicate clothing recommendations."""
        from engine.recommendation.engine import recommend_from_payload
        payloads = [
            {"temperature": 22, "uv_index": 8, "rain_probability": 75},
            {"temperature": 33, "rain_probability": 80, "rain_intensity": "heavy"},
            {"temperature": 8, "wind_speed": 40, "rain_probability": 60},
        ]
        for payload in payloads:
            result = recommend_from_payload(payload)
            clothing_items = [r for r in result["recommendations"] if r["category"] == "clothing"]
            assert len(clothing_items) <= 1, \
                f"Duplicate clothing recs in engine output: {[c['id'] for c in clothing_items]}"

    def test_coat_and_lightweight_not_in_same_message(self):
        """TC-CL-068: A single recommendation must not contain contradictory clothing items."""
        # Very cold: coat. Check 'very lightweight' doesn't appear.
        snap = make_snapshot(temperature_c=2.0)
        rec = clothing(snap)
        assert rec is not None
        assert "very lightweight" not in rec.message.lower(), \
            "Very cold recommendation should not suggest very lightweight clothing"

    def test_warm_message_does_not_suggest_coat(self):
        """TC-CL-069: Hot weather recommendation should not suggest a coat."""
        snap = make_snapshot(temperature_c=38.0)
        rec = clothing(snap)
        assert rec is not None
        assert "coat" not in rec.message.lower(), \
            f"Hot weather should not suggest a coat: {rec.message}"


# ===========================================================================
# SECTION 9 — Full Engine Integration Tests for Clothing
# TC-CL-070 through TC-CL-077
# ===========================================================================

class TestFullEngineIntegration:
    """Verify clothing recommendation via the full engine stack (recommend_from_payload)."""

    def test_full_engine_cold_day_contains_clothing(self):
        """TC-CL-070: Full engine with cold temperature must include clothing recommendation."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({"temperature": 8, "wind_speed": 10, "rain_probability": 5})
        cats = {r["category"] for r in result["recommendations"]}
        assert "clothing" in cats, f"Expected clothing category, got: {cats}"

    def test_full_engine_hot_day_contains_clothing(self):
        """TC-CL-071: Full engine with hot temperature must include clothing recommendation."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({"temperature": 36, "uv_index": 9, "rain_probability": 5})
        cats = {r["category"] for r in result["recommendations"]}
        assert "clothing" in cats, f"Expected clothing category, got: {cats}"

    def test_full_engine_clothing_has_reason_field(self):
        """TC-CL-072: Clothing recommendation must include a non-empty reason field."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({"temperature": 22, "uv_index": 3, "rain_probability": 5})
        clothing_items = [r for r in result["recommendations"] if r["category"] == "clothing"]
        assert clothing_items, "Expected at least one clothing recommendation"
        assert clothing_items[0]["reason"], "reason field must be non-empty"

    def test_full_engine_clothing_has_factors(self):
        """TC-CL-073: Clothing recommendation must include non-empty factors list."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({"temperature": 22, "rain_probability": 75})
        clothing_items = [r for r in result["recommendations"] if r["category"] == "clothing"]
        assert clothing_items
        assert len(clothing_items[0]["factors"]) > 0, "factors list should not be empty"

    def test_full_engine_hot_high_uv_rain_combination(self):
        """TC-CL-074: Hot + high UV + high rain via envelope format → clothing contains all three signals."""
        from engine.recommendation.engine import recommend_from_payload
        payload = {
            "request_id": "req_day11_test",
            "location": {"id": "loc_1", "label": "Home", "latitude": 6.9, "longitude": 79.8},
            "current": {
                "observed_at": "2026-09-20T10:00:00+05:30",
                "temperature_c": 33.0,
                "feels_like_c": 36.0,
                "humidity_percent": 80.0,
                "uv_index": 9.0,
                "rain_probability_percent": 75.0,
                "rain_intensity": "moderate",
                "condition": "partly_cloudy",
            },
        }
        result = recommend_from_payload(payload)
        clothing_items = [r for r in result["recommendations"] if r["category"] == "clothing"]
        assert clothing_items, "Expected clothing recommendation"
        msg = clothing_items[0]["message"].lower()
        assert "breathable" in msg or "lightweight" in msg
        assert "waterproof" in msg
        assert "sun protection" in msg

    def test_full_engine_missing_temperature_no_clothing(self):
        """TC-CL-075: Full engine without temperature must not produce a clothing recommendation."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({"uv_index": 9, "rain_probability": 80, "condition": "rain"})
        cats = {r["category"] for r in result["recommendations"]}
        assert "clothing" not in cats, f"clothing should be absent without temperature, got: {cats}"

    def test_full_engine_api_failure_simulation_returns_safe_defaults(self):
        """TC-CL-076: Engine still returns a valid result structure when optional fields are all None."""
        from engine.recommendation.engine import run_engine
        snap = WeatherSnapshot()  # All fields None
        result = run_engine(snap)
        # Engine must not crash; recommendations is always a list
        assert isinstance(result.recommendations, list)
        assert isinstance(result.limitations, list)

    def test_full_engine_empty_dict_payload_does_not_crash(self):
        """TC-CL-077: An empty payload must not crash the engine."""
        from engine.recommendation.engine import recommend_from_payload
        try:
            result = recommend_from_payload({})
            assert isinstance(result["recommendations"], list)
        except Exception as e:
            pytest.fail(f"Engine crashed on empty payload: {e}")


# ===========================================================================
# SECTION 10 — Regression Tests (Previously Completed Features)
# TC-REG-001 through TC-REG-010
# ===========================================================================

class TestRegression:
    """Regression: verify previously-completed features still work correctly."""

    def test_reg_comfortable_day_no_alerts(self):
        """TC-REG-001: Comfortable weather → no alerts, overall risk SAFE or LOW."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({
            "temperature": 22, "feels_like": 22, "humidity": 50,
            "wind_speed": 10, "uv_index": 4, "rain_probability": 10,
            "condition": "partly_cloudy",
        })
        assert result["alerts"] == [], "No alerts expected on comfortable day"
        assert result["analysis"]["risks"]["overall"] in {"SAFE", "LOW"}

    def test_reg_thunderstorm_remains_critical(self):
        """TC-REG-002: Thunderstorm → first recommendation is CRITICAL severity."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({
            "temperature": 24, "condition": "thunderstorm",
            "rain_probability": 80, "wind_speed": 20,
        })
        first = result["recommendations"][0]
        assert first["severity"] == "danger"
        assert first["priority"] == "CRITICAL"
        assert result["analysis"]["activity"] == "Avoid"

    def test_reg_heavy_rain_triggers_umbrella(self):
        """TC-REG-003: Heavy rain → umbrella category present in recommendations."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({
            "temperature": 24, "rain_probability": 90,
            "rain_intensity": "heavy", "condition": "rain",
        })
        cats = {r["category"] for r in result["recommendations"]}
        assert "umbrella" in cats, f"umbrella missing: {cats}"

    def test_reg_high_uv_triggers_uv_warning(self):
        """TC-REG-004: UV 11 → UV-related recommendation exists."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({
            "temperature": 24, "uv_index": 11,
            "rain_probability": 5, "condition": "clear",
        })
        text = " ".join(r["message"].lower() for r in result["recommendations"])
        assert "sunscreen" in text or "shade" in text or "sun" in text

    def test_reg_cold_and_strong_wind_risks(self):
        """TC-REG-005: Cold (6°C) + strong wind (42 km/h) → cold HIGH, wind HIGH risk."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({
            "temperature": 6, "feels_like": 1, "wind_speed": 42, "condition": "cloudy"
        })
        risks = result["analysis"]["risks"]
        assert risks["cold"] in {"HIGH", "CRITICAL"}
        assert risks["wind"] == "HIGH"

    def test_reg_hot_humid_triggers_hydration(self):
        """TC-REG-006: Hot (33°C) + high humidity (85%) → hydration recommendation present."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({
            "temperature": 33, "humidity": 85, "uv_index": 5, "rain_probability": 5
        })
        cats = {r["category"] for r in result["recommendations"]}
        assert "hydration" in cats

    def test_reg_missing_temperature_limitations_populated(self):
        """TC-REG-007: Missing temperature → 'temperature_missing' in limitations."""
        from engine.recommendation.engine import run_engine
        from engine.snapshot import snapshot_from_request
        weather = snapshot_from_request({
            "current": {"observed_at": "2026-09-20T08:00:00Z", "uv_index": 9}
        })
        result = run_engine(weather)
        assert "temperature_missing" in result.limitations

    def test_reg_invalid_wind_skipped(self):
        """TC-REG-008: Negative wind speed → wind analysis is None, no wind risk."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({
            "temperature": 22, "wind_speed": -5, "uv_index": 2,
            "rain_probability": 5, "condition": "clear",
        })
        assert result["analysis"]["wind"] is None
        assert result["analysis"]["risks"]["wind"] == "SAFE"

    def test_reg_low_rain_no_umbrella(self):
        """TC-REG-009: Low rain (10%) → no umbrella recommendation."""
        from engine.recommendation.engine import recommend_from_payload
        result = recommend_from_payload({
            "temperature": 22, "rain_probability": 10, "uv_index": 3,
            "wind_speed": 8, "condition": "clear",
        })
        cats = {r["category"] for r in result["recommendations"]}
        assert "umbrella" not in cats

    def test_reg_rain_later_includes_umbrella(self):
        """TC-REG-010: Forecast heavy rain later → umbrella category present."""
        from engine.recommendation.engine import recommend_from_payload
        payload = {
            "request_id": "req_regression",
            "location": {"id": "loc_home", "label": "Home", "latitude": 6.9, "longitude": 79.8},
            "current": {
                "observed_at": "2026-09-20T08:00:00+05:30",
                "temperature_c": 27,
                "rain_probability_percent": 15,
                "condition": "partly_cloudy",
            },
            "forecast": {
                "hours": [
                    {"time": "t1", "rain_probability_percent": 10, "condition": "clear"},
                    {"time": "t2", "rain_probability_percent": 10, "condition": "clear"},
                    {"time": "t3", "rain_probability_percent": 10, "condition": "clear"},
                    {"time": "t4", "rain_probability_percent": 80, "rain_intensity": "moderate", "condition": "rain"},
                ]
            },
        }
        result = recommend_from_payload(payload)
        cats = {r["category"] for r in result["recommendations"]}
        assert "umbrella" in cats


# ===========================================================================
# SECTION 11 — _rain_is_meaningful helper tests
# ===========================================================================

class TestRainIsMeaningful:
    """Unit-level tests for the internal _rain_is_meaningful predicate."""

    def test_probability_at_threshold_is_meaningful(self):
        """TC-RM-001: probability == light_max (40) → meaningful."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=40.0)
        assert _rain_is_meaningful(snap) is True

    def test_probability_below_threshold_not_meaningful(self):
        """TC-RM-002: probability < 40 → not meaningful."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=39.0)
        assert _rain_is_meaningful(snap) is False

    def test_moderate_intensity_is_meaningful(self):
        """TC-RM-003: rain_intensity='moderate' → meaningful regardless of probability."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=None, rain_intensity="moderate")
        assert _rain_is_meaningful(snap) is True

    def test_heavy_intensity_is_meaningful(self):
        """TC-RM-004: rain_intensity='heavy' → meaningful."""
        snap = make_snapshot(temperature_c=22.0, rain_intensity="heavy")
        assert _rain_is_meaningful(snap) is True

    def test_light_intensity_and_low_probability_not_meaningful(self):
        """TC-RM-005: rain_intensity='light' + probability=10 → NOT meaningful."""
        snap = make_snapshot(temperature_c=22.0, rain_probability_percent=10.0, rain_intensity="light")
        assert _rain_is_meaningful(snap) is False

    def test_none_probability_and_none_intensity_not_meaningful(self):
        """TC-RM-006: No rain data → not meaningful."""
        snap = make_snapshot(temperature_c=22.0)
        assert _rain_is_meaningful(snap) is False
