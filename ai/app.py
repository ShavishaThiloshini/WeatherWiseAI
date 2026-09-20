import os
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

from engine.recommendation.engine import recommend_from_payload

app = FastAPI(title="WeatherWise AI Recommendation Service", version="1.0.0")


class AssistantRequest(BaseModel):
    question: str = Field(min_length=1)
    weather: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/recommend")
def recommend(payload: dict[str, Any]) -> dict[str, Any]:
    return recommend_from_payload(payload)


@app.post("/assistant")
def assistant(body: AssistantRequest) -> dict[str, Any]:
    recommendation = recommend_from_payload(body.weather)
    summary = recommendation.get("assistant_context", {}).get("summary") or ""
    answer = (
        f"{body.question.strip()} — Based on current conditions: {summary}"
        if summary
        else f"{body.question.strip()} — Follow the structured weather advice for your location."
    )
    source = "deterministic_rules"
    if os.getenv("GEMINI_API_KEY"):
        source = "deterministic_fallback"
    return {
        "answer": answer,
        "source": source,
        "recommendations": recommendation.get("recommendations", []),
        "analysis": recommendation.get("analysis"),
    }
