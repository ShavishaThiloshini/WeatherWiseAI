# WeatherWise AI
### Backend Schema Document
*What data does our system need?*

| Field | Detail |
|---|---|
| Project | WeatherWise AI (Smart Weather Assistant) |
| Document | 05 of 6 - Backend Schema Document |
| Team | Shavi, Rahavi, Danu, Ruvethika |
| Version | 1.0 |
| Status | Draft for team review |

## 1. Purpose

This document defines the MySQL data model for WeatherWise AI: every entity, its fields, keys, and relationships. It is the reference for the Backend rotation days and the foundation the AI engine and Implementation Plan build against.

## 2. Entity Overview

- **User** — account and authentication.
- **UserPreference** — personalization settings (one-to-one with User).
- **Location** — saved places per user (Home, University, Workplace, Travel).
- **Plant** — user's plant profiles for watering advice.
- **WeatherSnapshot** — cached current-conditions reads per location.
- **ForecastCache** — cached hourly/daily forecast reads per location.
- **WeatherHistory** — daily/weekly summarized history per location.
- **Alert** — generated severe-weather alerts and their explanations.
- **Notification** — delivered/queued push notifications per user.
- **TravelAnalysis** — saved current-vs-destination risk comparisons.
- **AIConversation / AIMessage** — AI Weather Assistant chat history.

## 3. Entity-Relationship Summary

```
User (1) ----- (1) UserPreference
User (1) ----- (*) Location
User (1) ----- (*) Plant
User (1) ----- (*) Notification
User (1) ----- (*) TravelAnalysis
User (1) ----- (*) AIConversation ----- (*) AIMessage

Location (1) ----- (*) WeatherSnapshot
Location (1) ----- (*) ForecastCache
Location (1) ----- (*) WeatherHistory
Location (1) ----- (*) Alert

Plant (1) ----- (*) WateringRecommendation (derived, not stored long-term)
```

## 4. Entity Definitions

### 4.1 User
Stores account credentials and identity.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR(120) | Not null |
| email | VARCHAR(160) | Unique, not null |
| password_hash | VARCHAR(255) | Not null (bcrypt or equivalent) |
| created_at | TIMESTAMP | Not null, default now() |
| updated_at | TIMESTAMP | Not null, default now() |

### 4.2 UserPreference
One-to-one personalization settings used by the recommendation engine.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Foreign key -> User.id, unique |
| cold_tolerance | VARCHAR(20) | e.g. low / medium / high |
| preferred_activity | VARCHAR(40) | e.g. running, cycling, walking |
| preferred_activity_time | TIME | Nullable |
| units | VARCHAR(10) | metric / imperial, default metric |
| notifications_enabled | BOOLEAN | Default true |

### 4.3 Location
Saved places per user, including the default/current one.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Foreign key -> User.id |
| label | VARCHAR(60) | e.g. Home, University, Workplace, Travel |
| latitude | DECIMAL(9,6) | Not null |
| longitude | DECIMAL(9,6) | Not null |
| is_default | BOOLEAN | Default false; one default per user (app-enforced) |
| created_at | TIMESTAMP | Not null, default now() |

### 4.4 Plant
User's plant profiles used for watering recommendations.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Foreign key -> User.id |
| location_id | UUID | Foreign key -> Location.id |
| name | VARCHAR(60) | Not null, e.g. Tomato, Basil |
| species_type | VARCHAR(60) | Nullable, used to tune watering thresholds |
| last_watered_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | Not null, default now() |

### 4.5 WeatherSnapshot
Cached current-conditions reads, refreshed periodically per location.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| location_id | UUID | Foreign key -> Location.id |
| temperature | DECIMAL(5,2) | Not null |
| feels_like | DECIMAL(5,2) | Nullable |
| humidity | SMALLINT | 0-100 |
| wind_speed | DECIMAL(5,2) | Nullable |
| wind_direction | SMALLINT | 0-360 degrees, nullable |
| pressure | DECIMAL(6,2) | Nullable |
| visibility | DECIMAL(5,2) | Nullable |
| uv_index | DECIMAL(4,1) | Nullable |
| condition_code | VARCHAR(30) | e.g. clear, rain, storm |
| sunrise | TIME | Nullable |
| sunset | TIME | Nullable |
| fetched_at | TIMESTAMP | Not null, indexed |

### 4.6 ForecastCache
Cached hourly and multi-day forecast entries per location.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| location_id | UUID | Foreign key -> Location.id |
| forecast_for | TIMESTAMP | The hour/day this entry describes; indexed |
| granularity | VARCHAR(10) | 'hourly' or 'daily' |
| temperature | DECIMAL(5,2) | Not null |
| rain_probability | SMALLINT | 0-100, nullable |
| rain_intensity | VARCHAR(20) | Nullable, e.g. light/moderate/heavy |
| condition_code | VARCHAR(30) | Nullable |
| fetched_at | TIMESTAMP | Not null |

### 4.7 WeatherHistory
Summarized daily/weekly history retained for trend display.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| location_id | UUID | Foreign key -> Location.id |
| summary_date | DATE | Indexed |
| avg_temperature | DECIMAL(5,2) | Nullable |
| max_temperature | DECIMAL(5,2) | Nullable |
| min_temperature | DECIMAL(5,2) | Nullable |
| total_rain_mm | DECIMAL(6,2) | Nullable |
| dominant_condition | VARCHAR(30) | Nullable |

### 4.8 Alert
Generated severe-weather alerts with the reasoning behind each one.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| location_id | UUID | Foreign key -> Location.id |
| alert_type | VARCHAR(30) | heat / heavy_rain / thunderstorm / strong_wind / cold / high_uv |
| severity | VARCHAR(10) | low / medium / high |
| reason | TEXT | Explanation shown to the user (explainability, FR-06/FR-12) |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMP | Not null, default now(), indexed |

### 4.9 Notification
Delivered or queued push notifications per user.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Foreign key -> User.id |
| alert_id | UUID | Foreign key -> Alert.id, nullable (personalized notifications may not reference an alert) |
| title | VARCHAR(120) | Not null |
| body | TEXT | Not null |
| is_read | BOOLEAN | Default false |
| sent_at | TIMESTAMP | Not null, default now() |

### 4.10 TravelAnalysis
Saved current-vs-destination weather risk comparisons.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Foreign key -> User.id |
| origin_location_id | UUID | Foreign key -> Location.id |
| destination_latitude | DECIMAL(9,6) | Not null |
| destination_longitude | DECIMAL(9,6) | Not null |
| risk_level | VARCHAR(10) | low / medium / high |
| risk_factors | TEXT | Comma-separated or JSON list of contributing factors |
| suggested_departure | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | Not null, default now() |

### 4.11 AIConversation / AIMessage
AI Weather Assistant chat history, grouped into conversations.

**AIConversation**

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Foreign key -> User.id |
| started_at | TIMESTAMP | Not null, default now() |

**AIMessage**

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key |
| conversation_id | UUID | Foreign key -> AIConversation.id |
| sender | VARCHAR(10) | 'user' or 'assistant' |
| message | TEXT | Not null |
| created_at | TIMESTAMP | Not null, default now(), indexed |

## 5. Indexing & Performance Notes

- Index `location_id` + `fetched_at` on WeatherSnapshot and ForecastCache for fast "latest reading" lookups.
- Index `location_id` + `summary_date` on WeatherHistory to support fast trend queries.
- Index `user_id` on Notification, TravelAnalysis, and AIConversation for fast per-user history screens.
- Index `is_active` on Alert so the Safety Center query only scans currently active alerts.

## 6. Data Retention

- WeatherSnapshot and ForecastCache rows are short-lived cache entries and can be pruned after a rolling window (e.g. 7 days) once superseded by WeatherHistory summaries.
- WeatherHistory, Notification, and AIConversation/AIMessage are retained for the life of the user account to support the History feature (FR-19).