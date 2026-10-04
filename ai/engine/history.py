from typing import Any

from engine.constants.thresholds import (
    TEMPERATURE_THRESHOLDS,
    RAIN_PROBABILITY_THRESHOLDS,
    WIND_THRESHOLDS,
    UV_THRESHOLDS,
    HUMIDITY_THRESHOLDS,
)

def determine_trend(values: list[float]) -> str:
    if len(values) < 2:
        return "INSUFFICIENT_DATA"
    
    first = sum(values[:len(values)//2]) / len(values[:len(values)//2])
    second = sum(values[len(values)//2:]) / len(values[len(values)//2:])
    
    diff = second - first
    avg = sum(values) / len(values)
    
    if abs(diff) < (avg * 0.05) if avg != 0 else 0.5:
        return "STABLE"
    elif diff > 0:
        return "INCREASING"
    else:
        return "DECREASING"

def simple_trend(values: list[float], tolerance: float = 1.0) -> str:
    if len(values) < 2:
        return "INSUFFICIENT_DATA"
    
    diff = values[-1] - values[0]
    # Simple linear regression slope could be better, or just difference between halves.
    # The requirement says Dataset A (25, 25, 26, 25, 26) is STABLE
    # Dataset B (25, 27, 28, 30, 32) is INCREASING
    # Dataset C (32, 30, 28, 27, 25) is DECREASING
    # Dataset D (1 item) is INSUFFICIENT_DATA
    
    # We can just check correlation or simple difference between first half and second half
    half = len(values) // 2
    first_half = values[:half]
    second_half = values[-half:]
    
    avg_first = sum(first_half) / len(first_half)
    avg_second = sum(second_half) / len(second_half)
    
    if abs(avg_second - avg_first) <= tolerance:
        return "STABLE"
    elif avg_second > avg_first:
        return "INCREASING"
    else:
        return "DECREASING"

def analyze_temperature(history: list[dict[str, Any]]) -> dict[str, str]:
    temps = [record.get("temperature") for record in history if record.get("temperature") is not None]
    if not temps:
        return {"trend": "INSUFFICIENT_DATA", "summary": "Insufficient historical data to determine a reliable trend."}
    
    trend = simple_trend(temps, tolerance=1.5)
    
    hot_days = sum(1 for t in temps if t >= TEMPERATURE_THRESHOLDS["warm_max"])
    cold_days = sum(1 for t in temps if t < TEMPERATURE_THRESHOLDS["cold_max"])
    
    summary = ""
    if trend == "INCREASING":
        summary = "Temperatures have generally increased during the selected period."
    elif trend == "DECREASING":
        summary = "Temperatures have generally decreased during the selected period."
    elif trend == "STABLE":
        summary = "Temperatures have remained relatively stable."
    else:
        summary = "Insufficient historical data to determine a reliable trend."
        
    if hot_days > 0 and hot_days >= len(temps) * 0.3:
        summary += " Several warmer-than-usual days were recorded."
    elif cold_days > 0 and cold_days >= len(temps) * 0.3:
        summary += " Several cooler-than-usual days were recorded."
        
    return {"trend": trend, "summary": summary.strip()}

def analyze_rainfall(history: list[dict[str, Any]]) -> dict[str, str]:
    rain_probs = [record.get("rainProbability", record.get("precipitation", 0)) for record in history if record.get("rainProbability") is not None or record.get("precipitation") is not None]
    
    if not rain_probs:
        return {"trend": "INSUFFICIENT_DATA", "summary": "Insufficient historical data to determine a reliable trend."}
        
    trend = simple_trend(rain_probs, tolerance=10.0)
    
    heavy_rain = sum(1 for r in rain_probs if r >= RAIN_PROBABILITY_THRESHOLDS["moderate_max"])
    rain_days = sum(1 for r in rain_probs if r > 0)
    
    summary = ""
    if trend == "INCREASING":
        summary = "Rainfall has generally increased during the selected period."
    elif trend == "DECREASING":
        summary = "Rainfall has generally decreased during the selected period."
    elif trend == "STABLE":
        summary = "Rainfall has remained stable."
    else:
        summary = "Insufficient historical data to determine a reliable trend."
        
    if heavy_rain >= 2:
        summary += " Several heavier rainfall events occurred."
    elif rain_days >= len(rain_probs) * 0.5:
        summary += " Rain has occurred frequently during the recent period."
    elif rain_days == 0:
        summary += " Conditions have been mostly dry."
        
    return {"trend": trend, "summary": summary.strip()}

def analyze_uv(history: list[dict[str, Any]]) -> dict[str, str]:
    uvs = [record.get("uvIndex") for record in history if record.get("uvIndex") is not None]
    
    if not uvs:
        return {"trend": "INSUFFICIENT_DATA", "summary": "Insufficient historical data to determine a reliable trend."}
        
    trend = simple_trend(uvs, tolerance=1.5)
    
    high_uv = sum(1 for u in uvs if u >= UV_THRESHOLDS["high_max"])
    
    summary = ""
    if trend == "INCREASING":
        summary = "UV levels have generally increased."
    elif trend == "DECREASING":
        summary = "UV levels have generally decreased."
    elif trend == "STABLE":
        summary = "UV levels have remained stable."
    else:
        summary = "Insufficient historical data to determine a reliable trend."
        
    if high_uv >= 2:
        summary += " Several recent periods recorded elevated UV levels, suggesting regular sun protection may be useful during outdoor activities."
        
    return {"trend": trend, "summary": summary.strip()}

def analyze_wind(history: list[dict[str, Any]]) -> dict[str, str]:
    winds = [record.get("windSpeed") for record in history if record.get("windSpeed") is not None]
    
    if not winds:
        return {"trend": "INSUFFICIENT_DATA", "summary": "Insufficient historical data to determine a reliable trend."}
        
    trend = simple_trend(winds, tolerance=5.0)
    
    strong_wind = sum(1 for w in winds if w >= WIND_THRESHOLDS["moderate_max"])
    
    summary = ""
    if trend == "INCREASING":
        summary = "Wind speeds have generally increased."
    elif trend == "DECREASING":
        summary = "Wind speeds have generally decreased."
    elif trend == "STABLE":
        summary = "Wind conditions have remained normal."
    else:
        summary = "Insufficient historical data to determine a reliable trend."
        
    if strong_wind >= 2:
        summary += " The location has experienced several strong-wind periods recently."
        
    return {"trend": trend, "summary": summary.strip()}

def analyze_humidity(history: list[dict[str, Any]]) -> dict[str, str]:
    hums = [record.get("humidity") for record in history if record.get("humidity") is not None]
    
    if not hums:
        return {"trend": "INSUFFICIENT_DATA", "summary": "Insufficient historical data to determine a reliable trend."}
        
    trend = simple_trend(hums, tolerance=5.0)
    
    high_hum = sum(1 for h in hums if h >= HUMIDITY_THRESHOLDS["high_max"])
    
    summary = ""
    if trend == "INCREASING":
        summary = "Humidity levels have generally increased."
    elif trend == "DECREASING":
        summary = "Humidity levels have generally decreased."
    elif trend == "STABLE":
        summary = "Humidity levels have remained relatively stable."
    else:
        summary = "Insufficient historical data to determine a reliable trend."
        
    if high_hum >= len(hums) * 0.5:
        summary += " Persistently high humidity was observed."
        
    return {"trend": trend, "summary": summary.strip()}

def get_recurring_risks(history: list[dict[str, Any]]) -> list[str]:
    risks = []
    
    temps = [record.get("temperature") for record in history if record.get("temperature") is not None]
    rain_probs = [record.get("rainProbability", record.get("precipitation", 0)) for record in history if record.get("rainProbability") is not None or record.get("precipitation") is not None]
    uvs = [record.get("uvIndex") for record in history if record.get("uvIndex") is not None]
    winds = [record.get("windSpeed") for record in history if record.get("windSpeed") is not None]
    
    if temps:
        if sum(1 for t in temps if t >= TEMPERATURE_THRESHOLDS["high_heat_c"]) >= 2:
            risks.append("Repeated extreme heat")
        if sum(1 for t in temps if t < TEMPERATURE_THRESHOLDS["cold_max"]) >= 2:
            risks.append("Repeated cold conditions")
            
    if rain_probs:
        if sum(1 for r in rain_probs if r >= RAIN_PROBABILITY_THRESHOLDS["heavy_max"]) >= 2:
            risks.append("Repeated heavy rain")
            
    if uvs:
        if sum(1 for u in uvs if u >= UV_THRESHOLDS["high_max"]) >= 2:
            risks.append("Repeated high UV")
            
    if winds:
        if sum(1 for w in winds if w >= WIND_THRESHOLDS["strong_max"]) >= 2:
            risks.append("Repeated strong wind")
            
    return risks

def generate_insights(history: list[dict[str, Any]], location: str) -> list[str]:
    insights = []
    
    if not history:
        return insights
        
    temps = [record.get("temperature") for record in history if record.get("temperature") is not None]
    uvs = [record.get("uvIndex") for record in history if record.get("uvIndex") is not None]
    rain_probs = [record.get("rainProbability", record.get("precipitation", 0)) for record in history if record.get("rainProbability") is not None or record.get("precipitation") is not None]
    winds = [record.get("windSpeed") for record in history if record.get("windSpeed") is not None]
    
    hot_days = sum(1 for t in temps if t >= TEMPERATURE_THRESHOLDS["warm_max"]) if temps else 0
    high_uv = sum(1 for u in uvs if u >= UV_THRESHOLDS["high_max"]) if uvs else 0
    
    if hot_days >= 2 and high_uv >= 2:
        insights.append("Your recent weather history shows several hot days with elevated UV levels.")
    elif high_uv >= 2:
        insights.append("Several recent days had elevated UV levels.")
        
    rain_days = sum(1 for r in rain_probs if r > 0) if rain_probs else 0
    if rain_days >= len(history) * 0.4 and rain_days > 1:
        insights.append(f"Rain has been frequent in your selected location recently.")
        
    strong_wind = sum(1 for w in winds if w >= WIND_THRESHOLDS["moderate_max"]) if winds else 0
    if strong_wind >= 2:
        insights.append(f"Your selected location has experienced several strong-wind periods recently.")
        
    if not insights and history:
        insights.append(f"Weather in {location} has been relatively stable without significant extreme events recently.")
        
    return insights

def analyze_weather_trends(payload: dict[str, Any]) -> dict[str, Any]:
    history = payload.get("history", [])
    location = payload.get("location", "Unknown")
    time_range = payload.get("timeRange", "recent")
    
    if not history:
        return {
            "location": location,
            "timeRange": time_range,
            "summary": "Insufficient historical data to determine a reliable trend.",
            "temperatureTrend": {"trend": "INSUFFICIENT_DATA", "summary": "Insufficient historical data to determine a reliable trend."},
            "rainTrend": {"trend": "INSUFFICIENT_DATA", "summary": "Insufficient historical data to determine a reliable trend."},
            "uvTrend": {"trend": "INSUFFICIENT_DATA", "summary": "Insufficient historical data to determine a reliable trend."},
            "windTrend": {"trend": "INSUFFICIENT_DATA", "summary": "Insufficient historical data to determine a reliable trend."},
            "humidityTrend": {"trend": "INSUFFICIENT_DATA", "summary": "Insufficient historical data to determine a reliable trend."},
            "recurringRisks": [],
            "keyInsights": [],
            "confidence": "LOW"
        }
    
    temp_trend = analyze_temperature(history)
    rain_trend = analyze_rainfall(history)
    uv_trend = analyze_uv(history)
    wind_trend = analyze_wind(history)
    hum_trend = analyze_humidity(history)
    
    risks = get_recurring_risks(history)
    insights = generate_insights(history, location)
    
    summary = "Recent weather has been analyzed."
    
    if "INCREASING" in temp_trend["trend"]:
        summary = "Recent weather has been warming up."
    elif "DECREASING" in temp_trend["trend"]:
        summary = "Recent weather has been cooling down."
        
    if rain_trend["trend"] == "INCREASING" or "frequent" in rain_trend["summary"]:
        summary = summary.replace(".", " with frequent rainfall.")
        
    return {
        "location": location,
        "timeRange": time_range,
        "summary": summary,
        "temperatureTrend": temp_trend,
        "rainTrend": rain_trend,
        "uvTrend": uv_trend,
        "windTrend": wind_trend,
        "humidityTrend": hum_trend,
        "recurringRisks": risks,
        "keyInsights": insights,
        "confidence": "HIGH" if len(history) >= 5 else ("MEDIUM" if len(history) >= 2 else "LOW")
    }
