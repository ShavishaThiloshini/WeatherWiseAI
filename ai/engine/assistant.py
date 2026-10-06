import re
from typing import Any

from engine.recommendation.engine import run_engine
from engine.snapshot import snapshot_from_request


def _has_weather_data(weather: Any) -> bool:
    return any(value is not None for value in (
        weather.temperature_c,
        weather.feels_like_c,
        weather.condition,
        weather.rain_probability_percent,
        weather.uv_index,
        weather.wind_speed_kmh,
        weather.humidity_percent,
    )) or bool(weather.forecast_days)


def _matching_recommendations(result, categories: set[str]) -> list[str]:
    return [
        item.message
        for item in result.recommendations
        if item.category in categories
    ][:2]


def _question_answer(question: str, weather, result) -> str:
    text = re.sub(r"\s+", " ", question.strip().lower())
    location = weather.location_label or "your location"

    if not _has_weather_data(weather):
        return f"I don't have current weather data for {location}, so I can't answer that reliably. Refresh the weather and try again."

    if any(word in text for word in ("rain", "raining", "umbrella", "precipitation", "wet")):
        if "tomorrow" in text:
            tomorrow = weather.forecast_days[1] if len(weather.forecast_days) > 1 else None
            probability = tomorrow.get("rain_probability_percent") if tomorrow else None
            if probability is None:
                return "I don't have a daily rain forecast for tomorrow, so I can't reliably say whether you will need an umbrella."
            likelihood = "likely" if probability >= 60 else "possible" if probability >= 30 else "unlikely"
            advice = " Consider bringing an umbrella." if probability >= 40 else ""
            return f"For {location}, tomorrow's forecast shows a {probability:.0f}% rain chance, so rain is {likelihood}.{advice}"

        probability = weather.rain_probability_percent
        if probability is None:
            return "I don't have a rain probability for this forecast, so I can't reliably say whether you need an umbrella."
        likelihood = "likely" if probability >= 60 else "possible" if probability >= 30 else "unlikely"
        timing = {
            "soon": " Rain is indicated in the next few hours.",
            "later": " Rain is indicated later in the forecast.",
            "now": " Rain is indicated in the current conditions.",
        }.get(weather.rain_timing, "")
        advice = " Bring an umbrella." if probability >= 40 else ""
        return f"For {location}, there is a {probability:.0f}% rain chance, so rain is {likelihood}.{timing}{advice}"

    if any(word in text for word in ("uv", "sunburn", "sunscreen", "sun protection")):
        if weather.uv_index is None:
            return "I don't have a UV reading for this location right now."
        advice = " Use sun protection if you'll be outside." if weather.uv_index >= 6 else " UV is not currently in the high range."
        return f"In {location}, the current UV index is {weather.uv_index:g}.{advice}"

    if any(word in text for word in ("wind", "windy", "gust")):
        if weather.wind_speed_kmh is None:
            return "I don't have a current wind reading for this location."
        return f"In {location}, current wind speed is {weather.wind_speed_kmh:g} km/h."

    if any(word in text for word in ("temperature", "degrees", "hot", "cold", "feel like", "feels like")):
        if weather.temperature_c is None:
            return "I don't have a current temperature reading for this location."
        answer = f"In {location}, it's currently {weather.temperature_c:g}°C"
        if weather.feels_like_c is not None:
            answer += f", feeling like {weather.feels_like_c:g}°C"
        return answer + "."

    if any(word in text for word in ("wear", "clothes", "clothing", "dress")):
        advice = _matching_recommendations(result, {"clothing", "hydration", "umbrella"})
        return " ".join(advice) if advice else f"Current conditions: {result.summary}"

    if any(word in text for word in ("run", "running", "walk", "walking", "cycle", "cycling", "outside", "outdoor", "activity")):
        advice = _matching_recommendations(result, {"outdoor", "hydration", "umbrella"})
        if result.activity == "Avoid":
            return f"For {location}, outdoor activity is not recommended in these conditions. " + " ".join(advice)
        if result.activity == "Poor":
            return f"For {location}, outdoor activity may be uncomfortable or risky right now. " + " ".join(advice)
        return f"For {location}, outdoor activity suitability is {result.activity.lower()}. " + " ".join(advice)

    if any(word in text for word in ("forecast", "tomorrow", "week", "today")) and weather.forecast_days:
        day_index = 1 if "tomorrow" in text else 0
        if day_index >= len(weather.forecast_days):
            return "I don't have a daily forecast for tomorrow yet."
        day = weather.forecast_days[day_index]
        parts = []
        if day.get("max_temp_c") is not None and day.get("min_temp_c") is not None:
            parts.append(f"the forecast temperature range is {day['min_temp_c']:g}–{day['max_temp_c']:g}°C")
        if day.get("rain_probability_percent") is not None:
            parts.append(f"rain chance is {day['rain_probability_percent']:g}%")
        if parts:
            day_label = "tomorrow's" if day_index == 1 else "today's"
            return f"For {location}, {day_label} forecast shows " + " and ".join(parts) + "."

    details = []
    if weather.condition:
        details.append(weather.condition.replace("-", " "))
    if weather.temperature_c is not None:
        details.append(f"{weather.temperature_c:g}°C")
    if weather.rain_probability_percent is not None:
        details.append(f"{weather.rain_probability_percent:.0f}% rain chance")
    summary = result.summary
    if details:
        summary = f"{', '.join(details)}. {summary}"
    advice = _matching_recommendations(result, {"general", "outdoor", "hydration", "umbrella"})
    return f"For {location}: {summary} " + " ".join(advice)


def answer_weather_question(question: str, payload: dict) -> dict[str, Any]:
    weather = snapshot_from_request(payload)
    result = run_engine(weather)
    answer = _question_answer(question, weather, result)
    return {
        "answer": answer,
        "source": "deterministic_rules",
        "recommendations": [item.to_api() for item in result.recommendations],
        "analysis": {
            "activity": result.activity,
            "risks": {
                "heat": result.risks.heat,
                "cold": result.risks.cold,
                "rain": result.risks.rain,
                "wind": result.risks.wind,
                "uv": result.risks.uv,
                "overall": result.risks.overall,
            },
        },
    }
