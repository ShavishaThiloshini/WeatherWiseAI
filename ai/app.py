from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from engine.assistant import answer_weather_question
from engine.map_interpretation import interpret_map_location
from engine.recommendation.engine import recommend_from_payload

app = FastAPI(title="WeatherWise AI Recommendation Service", version="1.0.0")


class AssistantRequest(BaseModel):
    question: str = Field(min_length=1, max_length=300)
    weather: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/recommend")
def recommend(payload: dict[str, Any]) -> dict[str, Any]:
    return recommend_from_payload(payload)


@app.post("/map/interpret")
def map_interpret(payload: dict[str, Any]) -> dict[str, Any]:
    return interpret_map_location(payload)


@app.post("/assistant")
def assistant(body: AssistantRequest) -> dict[str, Any]:
    if not body.question.strip():
        raise HTTPException(status_code=422, detail="Question must not be blank.")
    return answer_weather_question(body.question, body.weather)

@app.post("/history/trends")
def history_trends(payload: dict[str, Any]) -> dict[str, Any]:
    from engine.history import analyze_weather_trends
    return analyze_weather_trends(payload)
