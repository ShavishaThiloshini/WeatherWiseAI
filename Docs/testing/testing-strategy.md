# WeatherWise AI
### Day 02 Testing Strategy

| Field | Detail |
|---|---|
| Project | WeatherWise AI (Smart Weather Assistant) |
| Document | Day 02 Testing Strategy |
| Owner | Testing / QA — Shavisha |
| Version | 2.0 |
| Status | Active QA foundation for the 30-day cycle |
| Related documents | PRD, TRD, AFD, BSD, Implementation Plan, Recommendation Architecture, Day 1 Test Strategy |

This document explains **how** WeatherWise AI will be tested throughout development. Detailed scenarios live in [test-scenarios.md](test-scenarios.md). Checklists live in [test-checklist.md](test-checklist.md). Risks live in [risk-register.md](risk-register.md). Regression lives in [regression-checklist.md](regression-checklist.md).

The Day 1 catalogue (`Docs/TestStrategy.md`) remains the requirement-traceable baseline (TC-001–TC-036 / FR-01–FR-20). Day 02 adds layer-based strategy, safety-critical rules, reusable checklists, and an expanded scenario list (TS-xxx) that QA will execute as features become available.

---

## 1. Purpose

Establish a reusable QA process before feature implementation accelerates. Every later feature should be tested by asking:

> How can this feature fail, and how do we prove that it works safely?

Incorrect safety advice is treated as a **Critical** defect. AI-generated text is never assumed correct; it is checked against project rules and the recommendation contract.

---

## 2. Architecture Review (Testing View)

WeatherWise AI is four layers. The mobile app must not call weather providers or the AI service directly.

```text
Frontend (React Native / TypeScript)
        |  HTTPS / REST + JWT
        v
Backend (Node.js + Express, /api/v1)
        |                 |
        |                 +--> MySQL (users, locations, cache, history)
        |                 +--> Weather / maps providers (server-side keys)
        v
AI Recommendation System (Python + FastAPI)
        |
        +--> Deterministic rule engine (required)
        +--> Optional grounded assistant (Gemini when configured)
```

### 2.1 What exists today (Day 02 snapshot)

| Layer | What is in the repo | Test implication |
|---|---|---|
| Frontend | Tab + nested stack navigation (Home, Forecast, Safety, Travel & Map, Profile / Plants / Assistant). Reusable `WeatherCard`, `InfoCard`, `ScreenContainer`, `LoadingPlaceholder`, `EmptyView`, `ErrorView`. Shared types in `mobile/src/types`. Placeholder `api.ts`, `weatherService.ts`, `locationService.ts` returning mocks. Home uses mock Colombo weather. | UI/navigation can be smoke-tested. Location permission, live weather, loading, and error paths are **not executable** until wired. |
| Backend | Express app with Helmet, CORS, JSON body, `GET /`, `GET /api/v1/health`, standard `{ error: { code, message } }` 404/500 handlers. MySQL pool exists; feature endpoints and auth are not implemented yet. | Health and error-shape tests are executable. Auth, weather, advice, and location APIs wait for later days. |
| Weather / data | Planned adapter + `WeatherSnapshot` / `ForecastCache`. No live provider integration yet. | Provider failure, timeout, and incomplete-data tests wait on the adapter. Design tests against TRD error handling now. |
| AI | FastAPI `/health`, `/recommend`, `/assistant`. Compact `WeatherInput` plus deterministic rules. Pytest covers health, heat/UV, thunderstorm, and no-key assistant fallback. Day 02 [Recommendation Architecture](../RecommendationArchitecture.md) defines the canonical envelope. | Rule tests are executable on the compact API. Contract-alignment tests (canonical request/response) must be added when Express proxies FastAPI. |

### 2.2 Planned communication to test

```text
Weather Data
      ↓
Backend (normalize, cache, auth)
      ↓
AI Recommendation Engine (rules + optional LLM)
      ↓
Recommendation / alerts (structured)
      ↓
Backend (validate, error codes)
      ↓
Frontend (cards, severity, explanations)
```

The recommendation shown on screen must correspond to the weather payload the backend sent to FastAPI, not to an unrelated mock or stale cache presented as live.

### 2.3 Layer boundaries testers must enforce

- Mobile calls Express only (`/api/v1/...`). Provider keys and Gemini keys stay server-side.
- Express sends **normalized** weather to FastAPI (no provider-specific field names).
- FastAPI returns structured recommendations with `factors`, `severity`, `source`, and `data_freshness`.
- Optional LLM may rephrase; it must not invent weather facts or override rule-engine safety decisions.
- Standard API error shape: `{ error: { code, message } }`. Known codes from the recommendation contract include `WEATHER_UNAVAILABLE`, `AI_SERVICE_UNAVAILABLE`, `AI_INVALID_RESPONSE`.

---

## 3. What Will Not Be Built on Day 02

Do not implement on this day: full Jest/Detox suites, a complete Postman collection run against unfinished APIs, live weather integration, database test harnesses, performance labs, penetration testing, or production deployment tests.

Those start when the matching feature lands. Until then, the artefacts in `Docs/testing/` are the process the team follows.

---

## 4. Test Priorities

Use these three levels consistently in scenarios, defects, and regression.

### Critical

Issues that can affect:

- User safety
- Severe weather warnings (storm, heavy rain, strong wind, heat, cold, high UV)
- Incorrect or dangerous recommendations
- Core weather data shown as if it were live when it is missing or stale
- Authentication / security (token leak, cross-user data access)
- Major system failures (app crash, unusable Home, total API outage with no recovery)

**Rule:** Incorrect safety advice is always Critical (or Blocker if the path cannot be used at all).

### High

Issues affecting:

- Main weather functionality
- Forecasts and rain timing
- Non-severe recommendations (clothing, umbrella on moderate rain)
- Location permission and saved locations
- Travel safety scoring
- Outdoor activity scoring
- Plant-care advice
- Meaningful error/offline recovery for core journeys

### Medium / Low

Issues affecting:

- Minor UI polish and visual inconsistency
- Copy that is not safety-related
- Non-critical edge cases with a workaround
- Secondary empty-state wording

Day 1 `P0` maps to **Critical**, `P1` to **High**, `P2` to **Medium / Low**.

---

## 5. Testing Categories

### 5.1 Functional testing

Verify each feature against PRD FR-01–FR-20 and the App Flow Document.

| Feature | What to prove |
|---|---|
| Location permission | Grant, deny, disabled services, timeout, manual fallback |
| Weather retrieval | Current conditions for the selected location only |
| Forecast display | Hourly and multi-day order, timezone, units |
| Rain prediction | Probability, timing, intensity, empty when unavailable |
| Clothing recommendation | Matches temperature / condition rules |
| Umbrella recommendation | Matches rain probability / intensity |
| Hydration recommendation | Matches heat / UV / dryness rules |
| Travel safety score | Origin vs destination factors are explainable |
| Outdoor activity score | Walking / running / cycling scores and best time |
| Severe weather warnings | Storm, rain, wind, heat, cold, UV — positive and negative cases |
| Plant-care recommendation | Water now / later / skip with reasoning |
| Saved locations | CRUD, default location, ownership isolation |
| AI assistant | Grounded on supplied weather; refuses out-of-scope questions |
| Auth | Register, login, JWT expiry, invalid credentials |
| Notifications | Delivery, opt-out, deep link |
| History | Daily/weekly summaries and empty state |
| Personalized dashboard | Preferences change advice without leaking other users' data |

### 5.2 UI testing

Verify:

- Correct screen rendering (placeholder vs live data clearly distinguished until mocks are removed)
- Navigation: five tabs; Travel → Map; Profile → Plants / Assistant
- Text visibility and contrast (UI/UX brief)
- Component consistency (`WeatherCard`, `InfoCard`, `SectionHeader`, state views)
- Loading, empty, and error states (`LoadingPlaceholder`, `EmptyView`, `ErrorView` + retry)
- Button / pressable interactions
- Scroll behavior on Home and long forecast lists
- Different screen sizes (phone + narrow width)
- Accessibility: labels, roles, non-color severity, touch targets

### 5.3 API testing

When endpoints exist, verify with Postman (or equivalent):

- Request format and HTTP method
- Response format and required fields
- HTTP status codes
- Missing / extra / invalid parameters
- Authentication and authorization
- Error responses (`{ error: { code, message } }`)
- Timeout handling
- API failures (4xx, 5xx, 429)
- Unexpected or null bodies that must not crash the client

Folder plan remains as in Day 1: Health, Auth, Locations, Weather, Advice/Alerts, Travel/Plants/History, Assistant, Negative/Security.

### 5.4 Integration testing

Focus on data correctness **between** layers, not isolated mocks.

```text
Frontend → Backend → Weather API / cache → AI engine → Backend → Frontend
```

Prove:

- The location the UI selected is the location the backend queried.
- Provider payload is normalized before FastAPI.
- FastAPI output is not rewritten into contradictory advice by Express or the UI.
- Cache freshness is visible (`data_freshness` / last updated).
- Failures degrade as specified (cache or retryable error — never invented advice).

### 5.5 AI / recommendation testing

The AI system is safety-related. Test weather → expected advice using project rules (PRD Section 7 and Recommendation Architecture).

| Condition | Expected direction |
|---|---|
| High temperature | Hydration warning, heat advice, reduced intense outdoor activity |
| Heavy rain | Umbrella/raincoat, travel caution |
| Thunderstorm | Avoid open outdoor areas; severe alert |
| Strong wind | Wind safety warning; travel/activity caution |
| Cold temperature | Warm clothing |
| High UV | Sunscreen, shade, protective clothing |
| Hot + dry | Hydration; plant watering when applicable |
| Rain expected | Reduce or skip watering when the plant profile says so |

Do **not** treat an LLM answer as automatically correct. Check:

- Recommendation category, severity, and `factors` match the input.
- No contradictory pair (e.g. “safe to run outdoors” + thunderstorm danger).
- Missing optional preferences use defaults; missing required weather fields fail closed (error or reduced advice), never silent unsafe advice.
- `source` is truthful (`deterministic_rules`, `gemini_grounded`, `deterministic_fallback`).

Positive cases: warning **should** appear at/above threshold.  
Negative cases: warning **must not** appear below threshold.

Current Day 1 rule examples in `ai/app.py` (until the shared config lands): heat at `temperature >= 35` or `uv_index >= 8`; rain at `rain_probability >= 70` or rain conditions; thunderstorm via condition text; wind at `wind_speed >= 40`; cold at `temperature <= 12`. Boundary tests must follow the **implemented** shared rule config, not a copy pasted into QA docs.

### 5.6 Error-handling testing

For every new feature, run the reusable checklist in [test-checklist.md](test-checklist.md): success, loading, empty, invalid input, API failure, network failure, timeout, unexpected response, meaningful message, no crash, no regression.

---

## 6. Safety-Critical Testing

Dedicated extra attention for:

- Thunderstorm warnings
- Heavy rain warnings
- Strong wind warnings
- Heat warnings
- Cold warnings
- High UV conditions
- Travel safety recommendations
- Outdoor activity recommendations that could encourage unsafe exposure

**Principle:** Incorrect safety advice is a high-priority (Critical) defect.

Test both:

**Positive:** Very high temperature → heat warning = YES, hydration advice = YES.  
**Negative:** Moderate temperature → heat warning = NO.

Also test simultaneous alerts (storm + wind + rain) so the UI remains readable and does not hide the most severe item.

---

## 7. Tools and Environments (progressive)

| When | Tool | Use |
|---|---|---|
| Now | Manual review + this documentation | Architecture, contracts, checklists |
| Backend endpoints appear | Postman | Contract, auth, negatives |
| Rules change | pytest (`ai/test_app.py` and later suites) | Deterministic recommendations |
| Client logic appears | Jest (or team runner) | Units, serializers, validators |
| Journeys exist | Device/emulator + later Detox if chosen | E2E smoke |
| Staging | Seeded users, mocked providers | Integration and regression |

Do not consume production weather quota in automated tests. Use fixtures from Day 1 (`weather.heat`, `weather.storm`, etc.).

---

## 8. Defect workflow

1. Record the issue (ID, area, steps, expected vs actual, evidence).
2. Explain why it matters (safety, data integrity, usability).
3. Assign Critical / High / Medium.
4. Do **not** rewrite another rotation’s implementation unless the team agrees.

QA owns process and evidence. Feature owners own the fix.

---

## 9. Day 02 Definition of Done (this package)

- [x] Architecture reviewed from a testing perspective
- [x] Testing strategy documented
- [x] Functional, UI, API, integration, AI categories defined
- [x] Risks, scenarios, priorities documented
- [x] Error-handling and integration checklists created
- [x] Safety-critical and edge-case approach documented
- [x] Regression approach documented
- [x] No unnecessary feature implementation
- [x] Git commit for this foundation
