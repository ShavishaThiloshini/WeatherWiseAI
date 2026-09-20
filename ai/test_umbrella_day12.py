"""
WeatherWise AI — Day 12 QA Testing
Umbrella / Rain Decision Engine Test Suite
Tester: Shavisha (AI / Smart Recommendation rotation)
Date: 2026-09-20
"""

import pytest
from engine.rules.umbrella import umbrella_rules, should_recommend_umbrella
from engine.types.recommendation import WeatherSnapshot, Recommendation


def umbrella(snapshot: WeatherSnapshot) -> Recommendation | None:
    recs = umbrella_rules(snapshot)
    if not recs:
        return None
    return recs[0]


class TestUmbrellaDecisionLogic:

    def test_0_percent_rain_probability(self):
        """0% rain probability -> No umbrella needed."""
        snap = WeatherSnapshot(rain_probability_percent=0.0)
        rec = umbrella(snap)
        assert rec is not None
        assert rec.title == "No umbrella needed"
        assert "No umbrella needed" in rec.message
        assert rec.priority == "INFO"
        assert rec.risk_level == "SAFE"

    def test_low_rain_probability(self):
        """Low rain probability (e.g., 30%) -> Umbrella recommended."""
        snap = WeatherSnapshot(rain_probability_percent=30.0)
        rec = umbrella(snap)
        assert rec is not None
        assert rec.title == "Umbrella recommended"
        assert "Umbrella recommended" in rec.message
        assert rec.priority == "LOW"

    def test_moderate_rain_probability(self):
        """Moderate rain probability (e.g., 60%) -> Carry an umbrella."""
        snap = WeatherSnapshot(rain_probability_percent=60.0)
        rec = umbrella(snap)
        assert rec is not None
        assert rec.title == "Carry an umbrella"
        assert "Carry an umbrella" in rec.message
        assert rec.priority == "MEDIUM"

    def test_high_rain_probability(self):
        """High rain probability (e.g., 80%) -> Raincoat may be useful."""
        snap = WeatherSnapshot(rain_probability_percent=80.0)
        rec = umbrella(snap)
        assert rec is not None
        assert rec.title == "Rain protection needed"
        assert "Raincoat may be useful" in rec.message
        assert rec.priority == "HIGH"

    def test_very_high_rain_probability(self):
        """Very high rain probability (e.g., 90%) -> Extreme rain -> Severe Weather Warning."""
        # Wait, heavy_max is 85. So 90% is extreme_rain!
        snap = WeatherSnapshot(rain_probability_percent=90.0)
        rec = umbrella(snap)
        assert rec is not None
        assert rec.title == "Severe Weather Warning"
        assert "Avoid unnecessary outdoor travel during severe rain" in rec.message
        assert rec.priority == "CRITICAL"

    def test_heavy_rain_intensity(self):
        """Heavy rain -> Raincoat may be useful."""
        snap = WeatherSnapshot(rain_intensity="heavy")
        rec = umbrella(snap)
        assert rec is not None
        assert "Raincoat may be useful" in rec.message
        assert rec.priority == "HIGH"

    def test_rain_expected_soon(self):
        """Rain expected soon -> message includes 'soon'."""
        snap = WeatherSnapshot(rain_probability_percent=50.0, rain_timing="soon")
        rec = umbrella(snap)
        assert rec is not None
        assert "Rain expected soon" in rec.message

    def test_rain_expected_later(self):
        """Rain expected later -> message includes 'later'."""
        snap = WeatherSnapshot(rain_probability_percent=30.0, rain_timing="later")
        rec = umbrella(snap)
        assert rec is not None
        assert "Rain possible later" in rec.message

    def test_thunderstorm_and_rain(self):
        """Thunderstorm + rain -> Safety overrides normal umbrella advice."""
        snap = WeatherSnapshot(rain_probability_percent=30.0, condition="thunderstorm")
        rec = umbrella(snap)
        assert rec is not None
        assert rec.title == "Severe Weather Warning"
        assert "Avoid unnecessary outdoor travel during severe rain" in rec.message
        assert rec.priority == "CRITICAL"
        assert rec.risk_level == "HIGH"

    def test_missing_rain_data(self):
        """Missing all rain data -> No recommendations emitted."""
        snap = WeatherSnapshot(temperature_c=25.0)
        rec = umbrella(snap)
        assert rec is None

    def test_invalid_rain_data(self):
        """Invalid rain intensity gracefully defaults to probability."""
        snap = WeatherSnapshot(rain_probability_percent=50.0, rain_intensity="invalid_value")
        rec = umbrella(snap)
        assert rec is not None
        # Should fallback to moderate_rain from probability=50
        assert rec.title == "Carry an umbrella"

    def test_no_rain_unlikely_message(self):
        """0% rain probability should say Rain unlikely."""
        snap = WeatherSnapshot(rain_probability_percent=0.0)
        rec = umbrella(snap)
        assert rec is not None
        assert "Rain unlikely during the selected period" in rec.message

    def test_extreme_rain_message(self):
        """Extreme rain -> Heavy rain expected during selected period."""
        snap = WeatherSnapshot(rain_intensity="extreme")
        rec = umbrella(snap)
        assert rec is not None
        assert "Heavy rain expected during the selected period" in rec.message

    def test_should_recommend_umbrella(self):
        assert should_recommend_umbrella(WeatherSnapshot(rain_probability_percent=80.0))
        assert should_recommend_umbrella(WeatherSnapshot(rain_probability_percent=75.0))
        assert not should_recommend_umbrella(WeatherSnapshot(rain_probability_percent=20.0))
