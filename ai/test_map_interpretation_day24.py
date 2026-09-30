import pytest
from engine.map_interpretation import interpret_map_location

def test_map_interpretation_normal_conditions():
    payload = {
        "temperature": 22,
        "feels_like": 22,
        "humidity": 50,
        "wind_speed": 10,
        "uv_index": 2,
        "condition": "clear sky"
    }
    result = interpret_map_location(payload)
    assert result["overallRisk"] == "SAFE"
    assert result["primaryCondition"] == "Comfortable"
    assert len(result["activeRisks"]) == 0
    assert len(result["keyFactors"]) > 0

def test_map_interpretation_heat():
    payload = {
        "temperature": 35,
        "feels_like": 38,
        "humidity": 40,
        "uv_index": 9,
    }
    result = interpret_map_location(payload)
    assert result["overallRisk"] in ["HIGH", "CRITICAL"] # UV 9 is High, Temp 35 is Moderate/High
    assert any("HEAT" in ar for ar in result["activeRisks"]) or any("UV" in ar for ar in result["activeRisks"])

def test_map_interpretation_thunderstorm():
    payload = {
        "condition": "thunderstorm with heavy rain",
        "rain_intensity": "heavy"
    }
    result = interpret_map_location(payload)
    assert result["overallRisk"] in ["HIGH", "CRITICAL"]
    assert "Thunderstorm" in result["primaryCondition"]

def test_map_interpretation_combined_risks():
    payload = {
        "temperature": 5,
        "wind_speed": 60,
    }
    result = interpret_map_location(payload)
    # Wind 60 is Critical/High, cold is likely Moderate/High. So should combine well.
    assert result["overallRisk"] in ["HIGH", "CRITICAL"]
    assert any("WIND" in ar for ar in result["activeRisks"])
    assert any("COLD" in ar for ar in result["activeRisks"])

def test_map_interpretation_missing_data():
    payload = {
        "temperature": 22,
    }
    result = interpret_map_location(payload)
    assert result["overallRisk"] == "SAFE"
    assert any("Temperature: 22" in f for f in result["keyFactors"])

def test_map_interpretation_rain():
    payload = {
        "rain_probability": 90,
        "rain_intensity": "heavy"
    }
    result = interpret_map_location(payload)
    assert result["overallRisk"] in ["MODERATE", "HIGH", "CRITICAL"]
    assert any("RAIN" in ar for ar in result["activeRisks"])
