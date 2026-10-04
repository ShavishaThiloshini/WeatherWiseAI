import pytest
from engine.history import (
    determine_trend,
    simple_trend,
    analyze_temperature,
    analyze_weather_trends,
    analyze_rainfall,
    analyze_uv,
    analyze_wind,
    analyze_humidity
)

def test_dataset_a_stable():
    # Dataset A — Stable: 25, 25, 26, 25, 26
    values = [25.0, 25.0, 26.0, 25.0, 26.0]
    assert simple_trend(values, tolerance=1.5) == "STABLE"

def test_dataset_b_increasing():
    # Dataset B — Increasing: 25, 27, 28, 30, 32
    values = [25.0, 27.0, 28.0, 30.0, 32.0]
    assert simple_trend(values, tolerance=1.5) == "INCREASING"

def test_dataset_c_decreasing():
    # Dataset C — Decreasing: 32, 30, 28, 27, 25
    values = [32.0, 30.0, 28.0, 27.0, 25.0]
    assert simple_trend(values, tolerance=1.5) == "DECREASING"

def test_dataset_d_insufficient():
    # Dataset D — Insufficient: Only one valid record
    values = [25.0]
    assert simple_trend(values, tolerance=1.5) == "INSUFFICIENT_DATA"

def test_analyze_weather_trends_empty():
    payload = {"location": "Colombo", "timeRange": "recent", "history": []}
    result = analyze_weather_trends(payload)
    assert result["location"] == "Colombo"
    assert result["timeRange"] == "recent"
    assert result["temperatureTrend"]["trend"] == "INSUFFICIENT_DATA"
    assert result["confidence"] == "LOW"

def test_analyze_weather_trends_valid():
    payload = {
        "location": "Kandy",
        "timeRange": "weekly",
        "history": [
            {"temperature": 25.0, "uvIndex": 4, "rainProbability": 10, "windSpeed": 10},
            {"temperature": 27.0, "uvIndex": 5, "rainProbability": 20, "windSpeed": 12},
            {"temperature": 28.0, "uvIndex": 6, "rainProbability": 30, "windSpeed": 15},
            {"temperature": 30.0, "uvIndex": 8, "rainProbability": 40, "windSpeed": 20},
            {"temperature": 32.0, "uvIndex": 9, "rainProbability": 50, "windSpeed": 25}
        ]
    }
    result = analyze_weather_trends(payload)
    assert result["location"] == "Kandy"
    assert result["temperatureTrend"]["trend"] == "INCREASING"
    assert result["uvTrend"]["trend"] == "INCREASING"
    assert result["confidence"] == "HIGH"
    
def test_recurring_risks():
    payload = {
        "history": [
            {"temperature": 36.0, "uvIndex": 9},
            {"temperature": 37.0, "uvIndex": 10},
        ]
    }
    result = analyze_weather_trends(payload)
    assert "Repeated extreme heat" in result["recurringRisks"]
    assert "Repeated high UV" in result["recurringRisks"]
