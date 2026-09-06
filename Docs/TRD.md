# WeatherWise AI
### Technical Requirement Document (TRD)
*How are we going to build it?*

| Field | Detail |
|---|---|
| Project | WeatherWise AI (Smart Weather Assistant) |
| Document | 02 of 6 - Technical Requirement Document |
| Team | Shavi, Rahavi, Danu, Ruvethika |
| Version | 1.0 |
| Status | Draft for team review |

## 1. Purpose

This document translates the Project Requirement Document (PRD) into a concrete technical approach: architecture, technology stack, API design, data flow, security, performance, error handling, deployment, and team workflow. It is the technical contract the four-day rotation (Frontend / Backend / AI / Testing) builds against.

## 2. System Architecture Overview

WeatherWise AI is a three-tier system: a React Native mobile client, a Node.js/Express backend API, and a Python/FastAPI AI recommendation microservice, backed by MySQL and supporting services for maps, weather data, and push notifications.

```
React Native App (TypeScript)
        |  HTTPS / REST + JWT
        v
Node.js + Express API  <----->  MySQL
   |            |
   |            +----> Firebase Cloud Messaging (push notifications)
   |            +----> Weather Provider API (current + forecast)
   |            +----> Maps Provider API
   |
   +----> Python + FastAPI  (Recommendation / AI Engine)
                |
                +----> Rule Engine (heat, rain, wind, storm, cold, UV)
                +----> AI Assistant (natural-language Q&A)
```

The mobile app never talks to the weather provider, maps provider, or AI engine directly — all external calls are proxied and cached through the Express backend, which keeps API keys server-side and gives a single point for rate-limiting and error handling.

## 3. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Mobile App | React Native + TypeScript | Single codebase for Android and iOS; typed code reduces runtime errors across a 4-person rotating team. |
| Backend API | Node.js + Express.js | Lightweight, well-documented, fast to build REST endpoints against within a 30-day window. |
| Database | MySQL | Relational integrity for users, locations, plants, and history; widely supported and straightforward to operate for the MVP. |
| AI / Recommendation Engine | Python + FastAPI | Python's data/ML ecosystem suits the rule engine and any later ML-assisted scoring; FastAPI is fast to stand up as an internal microservice. |
| Authentication | JWT (JSON Web Tokens) | Stateless auth that scales across mobile sessions without server-side session storage. |
| Notifications | Firebase Cloud Messaging (FCM) | Cross-platform push notifications for severe-weather and personalized alerts. |
| Maps | Google Maps (or equivalent) | Mature SDK for the interactive weather map (FR-15). |
| Weather Data | Third-party weather API | Source of current conditions and forecast data; abstracted behind a backend adapter so the provider can change without affecting the app. |
| Tooling | Git, GitHub, Postman, Figma | Version control, API testing, and design handoff. |

## 4. Frontend Architecture

- **Navigation:** bottom tab navigation (Home, Forecast, Safety, Travel & Map, Profile) with stack navigators nested inside each tab for detail screens.
- **State management:** React Context + hooks for session/auth state; local component state for screen-level UI; a lightweight data-fetching layer (e.g. React Query) for caching weather/forecast responses.
- **Folder structure:** `/screens`, `/components`, `/navigation`, `/services` (API clients), `/hooks`, `/types`, `/constants` (theme, spacing, breakpoints).
- **Offline/slow-network handling:** cached last-known weather is shown with a "last updated" timestamp when a fresh fetch fails.

## 5. Backend Architecture

- **Layered structure:** routes → controllers → services → data access (models), so business logic stays out of route handlers.
- **REST conventions:** resource-based URLs, standard HTTP verbs and status codes, versioned under `/api/v1`.
- **External API adapters:** a dedicated weather-provider adapter and maps adapter isolate third-party response shapes from the rest of the backend.
- **Scheduled jobs:** a lightweight job (cron or equivalent) refreshes cached forecasts and evaluates severe-weather thresholds to trigger notifications.

## 6. AI / Recommendation Engine Architecture

The recommendation engine is a separate FastAPI service so it can be developed and tested independently during the "AI" day of each team member's rotation.

- **Rule engine:** deterministic condition-to-advice mapping (see PRD Section 7) implemented as composable rules, each returning a recommendation plus the triggering factors (for explainability).
- **AI Assistant:** accepts a natural-language question plus the user's current weather/forecast context, and returns a grounded, weather-aware answer rather than a generic response.
- **Personalization layer:** adjusts recommendation thresholds using stored user preferences (e.g. cold tolerance, preferred activity times).
- **Communication:** the Express backend calls the FastAPI service over an internal HTTP endpoint and passes through the response; the mobile app never calls the AI service directly.

## 7. API Architecture

Representative endpoints — the full contract (request/response schemas) will be maintained in Postman alongside development.

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Create a new user account. | No |
| POST | `/api/v1/auth/login` | Authenticate and issue a JWT. | No |
| GET | `/api/v1/weather/current` | Current weather for a location. | Yes |
| GET | `/api/v1/weather/forecast` | Hourly + multi-day forecast. | Yes |
| GET | `/api/v1/advice/today` | Smart Advice for the active location. | Yes |
| GET | `/api/v1/alerts` | Active severe-weather alerts with explanations. | Yes |
| POST | `/api/v1/travel/compare` | Compare current vs destination weather; return risk score. | Yes |
| GET/POST | `/api/v1/locations` | List / add saved locations. | Yes |
| GET/POST | `/api/v1/plants` | List / add plant profiles and get watering advice. | Yes |
| GET | `/api/v1/history` | Daily/weekly weather history and trends. | Yes |
| POST | `/api/v1/assistant/ask` | Ask the AI Weather Assistant a question. | Yes |
| GET/PATCH | `/api/v1/users/preferences` | Read/update personalization preferences. | Yes |

## 8. Database

MySQL is the system of record for users, locations, plants, preferences, notifications, and weather history. Full entity definitions, fields, and relationships are specified in the Backend Schema Document (Document 05).

## 9. Security

- Passwords hashed with a strong algorithm (e.g. bcrypt); never stored in plain text.
- JWT access tokens with a short expiry, refreshed via a refresh-token flow.
- All traffic over HTTPS; third-party API keys kept server-side only.
- Input validation on every endpoint; parameterized queries to prevent SQL injection.
- Rate limiting on auth and AI-assistant endpoints to prevent abuse.

## 10. Performance

- Cache recent weather/forecast responses (short TTL) to reduce redundant third-party API calls and speed up repeat home-screen loads.
- Paginate list endpoints (history, notifications) rather than returning unbounded result sets.
- Run non-urgent work (forecast refresh, notification evaluation) as background jobs rather than on the request path.

## 11. Error Handling

- Standard error response shape across all endpoints: `{ error: { code, message } }`.
- Third-party API failures (weather, maps) are caught and degrade to cached data with a clear "using last-known data" indicator rather than a broken screen.
- Retries with backoff for transient failures when calling external providers; a circuit breaker avoids hammering a provider that is down.

## 12. Deployment

- **Environments:** local development, a shared staging environment for team integration (Day 29), and a demo/production build for the Day 30 presentation.
- Backend and AI service containerized (Docker) for consistent environments across all four members' machines.
- Mobile app built via Expo/React Native build tooling for demo installs on test devices.

## 13. Git Workflow

- **Branching:** `main` (stable) + feature branches named per rotation task, e.g. `feature/heat-warning-alert`.
- Pull requests required before merging to `main`; at least one other team member reviews, since roles rotate and everyone reads every part of the codebase over time.
- **Commit convention:** short, imperative messages (e.g. "Add travel risk scoring endpoint").

## 14. Traceability to Non-Functional Requirements

| NFR (from PRD) | Technical Mechanism |
|---|---|
| Performance | Response caching, background jobs, pagination. |
| Security | JWT auth, hashed passwords, HTTPS, input validation. |
| Privacy | Location permission flow; server never exposes raw provider keys to the client. |
| Reliability | Retries, backoff, circuit breaker, graceful degradation to cached data. |
| Scalability | Stateless JWT auth; adapter pattern isolates the weather provider so it can be swapped or scaled independently. |
| Maintainability | Layered backend (routes/controllers/services), separate AI microservice, modular frontend folders. |