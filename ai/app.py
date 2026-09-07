import json
import os
from typing import Any
from urllib import request

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="WeatherWise AI Recommendation Service", version="1.0.0")


class WeatherInput(BaseModel):
    temperature: float
    uv_index: float = Field(default=0, ge=0)
    rain_probability: float = Field(default=0, ge=0, le=100)
    wind_speed: float = Field(default=0, ge=0)
    condition: str = "clear"
    humidity: float | None = Field(default=None, ge=0, le=100)


class AssistantInput(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    weather: WeatherInput


def build_recommendations(weather: WeatherInput) -> list[dict[str, Any]]:
    recommendations: list[dict[str, Any]] = []
    condition = weather.condition.lower()

    if weather.temperature >= 35 or weather.uv_index >= 8:
        recommendations.append({
            "category": "heat_and_uv",
            "severity": "high" if weather.temperature >= 35 else "medium",
            "message": "Drink water, use sunscreen, seek shade, and reduce intense outdoor activity.",
            "factors": {"temperature": weather.temperature, "uv_index": weather.uv_index},
        })
    elif weather.temperature <= 12:
        recommendations.append({
            "category": "cold",
            "severity": "medium",
            "message": "Wear warm layers and protect yourself from the cold.",
            "factors": {"temperature": weather.temperature},
        })

    if weather.rain_probability >= 70 or condition in {"rain", "heavy_rain"}:
        recommendations.append({
            "category": "rain",
            "severity": "high" if weather.rain_probability >= 85 else "medium",
            "message": "Carry an umbrella or raincoat and consider postponing unnecessary travel.",
            "factors": {"rain_probability": weather.rain_probability, "condition": weather.condition},
        })

    if "storm" in condition or "thunder" in condition:
        recommendations.append({
            "category": "thunderstorm",
            "severity": "high",
            "message": "Avoid open areas and unnecessary outdoor activity until the storm passes.",
            "factors": {"condition": weather.condition},
        })

    if weather.wind_speed >= 40:
        recommendations.append({
            "category": "strong_wind",
            "severity": "high",
            "message": "Use caution when travelling and avoid risky outdoor activities.",
            "factors": {"wind_speed": weather.wind_speed},
        })

    if not recommendations:
        recommendations.append({
            "category": "general",
            "severity": "low",
            "message": "Conditions look suitable for normal activities. Stay aware of forecast changes.",
            "factors": {"temperature": weather.temperature, "condition": weather.condition},
        })

    return recommendations


def gemini_answer(payload: AssistantInput, api_key: str, model: str) -> str:
    prompt = (
        "Answer the user's weather question using only the supplied weather context. "
        "Be concise, practical, and mention safety when relevant.\n"
        f"Question: {payload.question}\nWeather: {payload.weather.model_dump_json()}"
    )
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    req = request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read())
        return result["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Gemini assistant is temporarily unavailable") from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "weatherwise-ai"}


@app.post("/recommend")
def recommend(weather: WeatherInput) -> dict[str, Any]:
    return {"source": "deterministic_rules", "recommendations": build_recommendations(weather)}


@app.post("/assistant")
def assistant(payload: AssistantInput) -> dict[str, str]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        recommendations = build_recommendations(payload.weather)
        return {
            "source": "deterministic_rules",
            "answer": recommendations[0]["message"],
        }
    return {
        "source": "gemini",
        "answer": gemini_answer(payload, api_key, os.getenv("GEMINI_MODEL", "gemini-2.0-flash")),
    }
