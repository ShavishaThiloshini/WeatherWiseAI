# WeatherWise AI Service

FastAPI recommendation service for the WeatherWise AI project.

## Run locally

```powershell
cd ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app:app --reload --port 8001
```

The deterministic recommendation endpoint works without an API key:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8001/recommend -ContentType 'application/json' -Body '{"temperature":36,"uv_index":9,"rain_probability":10,"wind_speed":8,"condition":"clear"}'
```

`/assistant` uses the deterministic weather rules and the live current/hourly/daily weather context supplied by the backend. It answers common rain, temperature, UV, wind, clothing, activity, and forecast questions without requiring an external model API key. Answers explicitly state when the requested weather field is unavailable.

## Endpoints

- `GET /health`
- `POST /recommend` — compact weather or Day 02 envelope; rule engine in `engine/`
- `POST /assistant`

## Tests

```powershell
cd ai
python -m pytest
```

Day 03 architecture notes: `Docs/ai/`.
