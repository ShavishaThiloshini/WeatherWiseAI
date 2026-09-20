"""
WeatherWise AI — Day 12 QA Testing
Rain / Travel Recommendation Test Suite
Tester: Rakavi (Testing rotation)
Date: 2026-09-20
"""

import pytest

from engine.rules.rain import rain_risk_level, rain_rules
from engine.types.recommendation import WeatherSnapshot


def rain(snapshot: WeatherSnapshot):
    recs = rain_rules(snapshot)
    if not recs:
        return None
    return recs[0]


class TestRainRiskLevel:

    def test_low_probability_is_safe(self):
        snap = WeatherSnapshot(rain_probability_percent=15.0)
        assert rain_risk_level(snap) == "SAFE"

    def test_moderate_probability_is_moderate_risk(self):
        snap = WeatherSnapshot(rain_probability_percent=55.0)
        assert rain_risk_level(snap) == "MODERATE"

    def test_heavy_probability_is_high_risk(self):
        snap = WeatherSnapshot(rain_probability_percent=80.0)
        assert rain_risk_level(snap) == "HIGH"

    def test_heavy_intensity_is_high_risk(self):
        snap = WeatherSnapshot(rain_intensity="heavy")
        assert rain_risk_level(snap) == "HIGH"


class TestRainRecommendationScenarios:

    def test_low_rain_emits_no_travel_warning(self):
        snap = WeatherSnapshot(rain_probability_percent=10.0, temperature_c=22.0)
        assert rain(snap) is None

    def test_moderate_rain_travel_caution(self):
        snap = WeatherSnapshot(rain_probability_percent=55.0)
        rec = rain(snap)
        assert rec is not None
        assert rec.title == "Rain travel caution"
        assert rec.category == "travel"
        assert rec.priority == "MEDIUM"
        assert "Rain is likely" in rec.message

    def test_heavy_rain_warning(self):
        snap = WeatherSnapshot(rain_probability_percent=80.0, rain_intensity="heavy")
        rec = rain(snap)
        assert rec is not None
        assert rec.title == "Heavy rain warning"
        assert rec.priority == "HIGH"
        assert "Heavy rain is expected" in rec.message
        assert "travel caution" in rec.message.lower()

    def test_rain_expected_soon(self):
        snap = WeatherSnapshot(rain_probability_percent=60.0, rain_timing="soon")
        rec = rain(snap)
        assert rec is not None
        assert " soon" in rec.message

    def test_rain_expected_later(self):
        snap = WeatherSnapshot(rain_probability_percent=60.0, rain_timing="later")
        rec = rain(snap)
        assert rec is not None
        assert " later today" in rec.message

    def test_missing_rain_data_emits_nothing(self):
        snap = WeatherSnapshot(temperature_c=24.0)
        assert rain(snap) is None

    def test_factors_include_probability_and_intensity(self):
        snap = WeatherSnapshot(rain_probability_percent=75.0, rain_intensity="moderate")
        rec = rain(snap)
        assert rec is not None
        names = {item["name"] for item in rec.factors}
        assert "rain_probability_percent" in names
        assert "rain_intensity" in names
