import json
import os
from typing import Any
from urllib import request

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from engine.recommendation.engine import recommend_from_payload

load_dotenv()
app = FastAPI(title="WeatherWise AI Recommendation Service", version="1.0.0")


class WeatherInput(BaseModel):
    """Compact Day 1 payload. Envelope requests use POST /recommend with `current`."""

    temperature: float
    uv_index: float | None = Field(default=None, ge=0)
    rain_probability: float | None = Field(default=None, ge=0, le=100)
    wind_speed: float | None = Field(default=None, ge=0)
    condition: str | None = "clear"
    humidity: float | None = Field(default=None, ge=0, le=100)
    feels_like: float | None = None
    rain_intensity: str | None = None
    wind_gust: float | None = Field(default=None, ge=0)
    rain_timing: str | None = None


class AssistantInput(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    weather: WeatherInput


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
def recommend(payload: dict[str, Any]) -> dict[str, Any]:
    has_envelope = isinstance(payload.get("current"), dict)
    has_compact = payload.get("temperature") is not None
    if not has_envelope and not has_compact:
        raise HTTPException(
            status_code=422,
            detail="Provide compact fields (temperature) or a current-weather envelope.",
        )
    return recommend_from_payload(payload)


@app.post("/assistant")
def assistant(payload: AssistantInput) -> dict[str, str]:
    recommendations = recommend_from_payload(payload.weather.model_dump())["recommendations"]
    fallback_answer = recommendations[0]["message"] if recommendations else (
        "I need weather context to give useful advice."
    )
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not api_key:
        return {
            "source": "deterministic_rules",
            "answer": fallback_answer,
        }

    try:
        return {
            "source": "gemini",
            "answer": gemini_answer(payload, api_key, os.getenv("GEMINI_MODEL", "gemini-2.0-flash")),
        }
    except Exception:
        return {
            "source": "deterministic_fallback",
            "answer": fallback_answer,
        }
