import pytest
from engine.types.recommendation import WeatherSnapshot
from engine.rules.heat import heat_rules, heat_risk_level
from engine.rules.uv import uv_rules, uv_risk_level

def make_weather(temp=None, feels_like=None, humidity=50, uv_index=None):
    return WeatherSnapshot(
        request_id="test",
        location_id=1,
        location_label="Test",
        latitude=0.0,
        longitude=0.0,
        timezone="UTC",
        temperature_c=temp,
        feels_like_c=feels_like,
        condition="sunny",
        humidity_percent=humidity,
        wind_speed_kmh=10,
        wind_direction="N",
        uv_index=uv_index,
        rain_probability_percent=0,
        visibility_km=10,
        observed_at="2026-09-13T12:00:00Z",
        limitations=set()
    )

def test_normal_temp_low_uv():
    weather = make_weather(temp=20, feels_like=20, uv_index=2)
    assert heat_risk_level(weather) == "SAFE"
    assert not heat_rules(weather)
    assert uv_risk_level(weather) == "SAFE"
    assert not uv_rules(weather)

def test_hot_temp_moderate_uv():
    weather = make_weather(temp=33, feels_like=33, uv_index=7)
    assert heat_risk_level(weather) == "MODERATE"
    heat_recs = heat_rules(weather)
    assert len(heat_recs) == 1
    assert heat_recs[0].priority == "MEDIUM"

    assert uv_risk_level(weather) == "MODERATE"
    uv_recs = uv_rules(weather)
    assert len(uv_recs) == 1
    assert uv_recs[0].priority == "MEDIUM"

def test_very_hot_temp_high_uv():
    weather = make_weather(temp=37, feels_like=39, humidity=80, uv_index=9)
    assert heat_risk_level(weather) == "CRITICAL"
    heat_recs = heat_rules(weather)
    assert len(heat_recs) == 1
    assert heat_recs[0].priority == "CRITICAL"
    assert "sun protection" in heat_recs[0].message.lower()

    assert uv_risk_level(weather) == "HIGH"
    uv_recs = uv_rules(weather)
    assert len(uv_recs) == 1
    assert uv_recs[0].priority == "HIGH"

def test_comfortable_temp_extreme_uv():
    weather = make_weather(temp=22, feels_like=22, uv_index=11)
    assert heat_risk_level(weather) == "SAFE"
    
    assert uv_risk_level(weather) == "CRITICAL"
    uv_recs = uv_rules(weather)
    assert len(uv_recs) == 1
    assert uv_recs[0].priority == "HIGH" # According to uv_rules, priority is HIGH for CRITICAL risk
    assert uv_recs[0].risk_level == "CRITICAL"

def test_missing_temperature():
    weather = make_weather(temp=None, feels_like=None, uv_index=2)
    assert heat_risk_level(weather) == "SAFE"
    assert not heat_rules(weather)

def test_missing_uv():
    weather = make_weather(temp=25, feels_like=25, uv_index=None)
    assert heat_risk_level(weather) == "SAFE"
    assert uv_risk_level(weather) == "SAFE"
    assert not uv_rules(weather)

def test_invalid_weather_values():
    weather = make_weather(temp=-999, uv_index=-10)
    # The classification functions might classify -999 as cold, so heat risk is SAFE
    assert heat_risk_level(weather) == "SAFE"
    assert uv_risk_level(weather) == "SAFE"
