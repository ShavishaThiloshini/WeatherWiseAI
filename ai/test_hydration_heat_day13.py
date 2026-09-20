"""
WeatherWise AI — Day 13 AI Testing
Hydration and Heat Recommendation Logic
Owner: Rakavi (AI rotation)
Date: 2026-09-20
"""

from engine.recommendation.engine import recommend_from_payload
from engine.rules.heat import heat_risk_level, heat_rules
from engine.rules.hydration import hydration_rules
from engine.types.recommendation import WeatherSnapshot


class TestHeatLogic:

    def test_comfortable_day_no_heat_warning(self):
        snap = WeatherSnapshot(temperature_c=22.0, humidity_percent=50.0)
        assert heat_risk_level(snap) == "SAFE"
        assert heat_rules(snap) == []

    def test_high_heat_risk_at_threshold(self):
        snap = WeatherSnapshot(temperature_c=36.0, feels_like_c=38.0)
        assert heat_risk_level(snap) in {"HIGH", "CRITICAL"}
        recs = heat_rules(snap)
        assert recs
        assert recs[0].category == "outdoor"

    def test_hot_humid_elevates_risk(self):
        snap = WeatherSnapshot(temperature_c=33.0, humidity_percent=85.0)
        assert heat_risk_level(snap) in {"MODERATE", "HIGH"}


class TestHydrationLogic:

    def test_hot_day_triggers_hydration(self):
        snap = WeatherSnapshot(temperature_c=36.0, feels_like_c=38.0, humidity_percent=70.0)
        recs = hydration_rules(snap)
        assert recs
        assert recs[0].category == "hydration"
        assert "hydrated" in recs[0].message.lower()

    def test_missing_temperature_skips_hydration(self):
        snap = WeatherSnapshot(uv_index=9.0, condition="clear")
        assert hydration_rules(snap) == []

    def test_engine_hot_day_includes_hydration_and_heat_risk(self):
        payload = {
            "temperature": 36,
            "feels_like": 38,
            "humidity": 70,
            "uv_index": 9,
            "rain_probability": 10,
            "wind_speed": 8,
            "condition": "clear",
        }
        result = recommend_from_payload(payload)
        categories = {item["category"] for item in result["recommendations"]}
        assert "hydration" in categories
        assert result["analysis"]["risks"]["heat"] in {"HIGH", "CRITICAL"}
