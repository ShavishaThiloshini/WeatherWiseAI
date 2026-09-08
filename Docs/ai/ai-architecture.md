# WeatherWise AI
### Day 03 AI Architecture

| Field | Detail |
|---|---|
| Document | Rule-based recommendation foundation |
| Owner | AI / Smart Recommendation — Shavisha |
| Related | [Recommendation Architecture](../RecommendationArchitecture.md), PRD Section 7 |

The FastAPI service stays the integration boundary. Day 03 adds a modular **deterministic** engine under `ai/engine/`. No ML model and no new LLM features were added.

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
Explainable recommendations + alerts + analysis
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
    ├── rules/                     Explainable domain rules
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

`analysis` and `alerts` are extra Day 03 fields so backend/frontend can show classification and safety banners without re-implementing rules.
