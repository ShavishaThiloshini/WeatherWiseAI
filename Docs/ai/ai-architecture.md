# WeatherWise AI
### Day 20 AI Architecture

| Field | Detail |
|---|---|
| Document | Rule-based recommendation foundation |
| Owner | AI / Smart Recommendation — Shavisha |
| Related | [Recommendation Architecture](../RecommendationArchitecture.md), PRD Section 7 |

The FastAPI service stays the integration boundary. The deterministic engine under `ai/engine/` processes weather data into domain-specific risks and aggregates them into a combined overall weather risk classification (added Day 20). No ML model and no new LLM features were added.

```text
Weather Data (compact or Day 02 envelope)
     ↓
Normalize to WeatherSnapshot (do not invent missing fields)
     ↓
Classify: temperature, rain, wind, UV, humidity, thunderstorm
     ↓
Evaluate risks: heat, cold, rain, wind, UV, travel, outdoor
     ↓
Apply rule modules
     ↓
Conflict resolution (safety overrides comfort)
     ↓
Priority sort
     ↓
Combine overall weather risk (Day 20)
     ↓
Explainable recommendations + alerts + overall_risk + analysis
```

## Layout

```text
ai/
├── app.py                         FastAPI: /health, /recommend, /assistant
└── engine/
    ├── constants/thresholds.py    Single source of numeric thresholds
    ├── types/recommendation.py    Snapshot, recommendation, risk types
    ├── snapshot.py                Compact and envelope adapters
    ├── categories/                Condition labels
    ├── rules/                     Explainable domain rules and overall_risk.py
    └── recommendation/
        ├── engine.py
        ├── priority.py
        └── conflict.py
```

Travel-destination scoring, plant care, personalization, and the chat UI remain later-day work. Preferences are accepted on the envelope but not applied yet.

## Inputs

See [weather-categories.md](weather-categories.md) for field-to-rule mapping. `/recommend` accepts:

- **Compact (Day 1):** `temperature`, optional `uv_index`, `rain_probability`, `wind_speed`, `condition`, `humidity`, `feels_like`, `rain_intensity`, `rain_timing`
- **Envelope (Day 2):** `request_id`, `location`, `current`, optional `forecast.hours` for rain timing (`soon` = first 3 hours, `later` = after that)

## Outputs

Each recommendation includes `id`, `category`, `title`, `message`, `reason`, `priority`, `risk_level`, `severity`, `factors`, plus optional `action`, `score`, `valid_from`, `valid_until`.

`severity` matches the Day 02 contract: `info`, `success`, `warning`, `danger` (mapped from priority). Canonical `category` values: `clothing`, `umbrella`, `hydration`, `travel`, `outdoor`, `plant-care`, `general`.

`overall_risk` (Day 20 addition) provides a combined safety classification (`level`, `title`, `summary`, `reasons`, and `active_risks`) for consumption by the Safety & Alerts screen and Alerts API. It never replaces individual recommendations.

`analysis` and `alerts` remain available so backend/frontend can show classification and safety banners without re-implementing rules.
