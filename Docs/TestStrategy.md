# WeatherWise AI
### Day 1 Test Strategy, Test Cases, and QA Checklist

| Field | Detail |
|---|---|
| Project | WeatherWise AI (Smart Weather Assistant) |
| Document | Day 1 Testing Deliverable |
| Owner | Testing rotation |
| Version | 1.0 |
| Status | Completed - Day 1 QA baseline |
| Related documents | PRD, TRD, AFD, UI/UX Design Brief, BSD, Implementation Plan |

## 1. Purpose

This document defines the test approach for the 30-day WeatherWise AI build. It provides the initial test strategy, a traceable baseline of functional test cases, test data, and a QA checklist for feature handoffs and the Day 29/30 integration and release passes.

The strategy is risk-based. Weather interpretation, safety alerts, location privacy, authentication, and graceful failure receive the highest priority because incorrect behavior can cause users to make unsafe decisions or lose trust in the application.

## 2. Quality Objectives

- Verify all functional requirements FR-01 through FR-20 from the PRD.
- Confirm weather advice and alerts are deterministic, explainable, and based on the supplied weather data.
- Confirm the mobile app remains usable during loading, empty, error, offline, and stale-data states.
- Confirm authentication, location data, preferences, and provider credentials are protected.
- Confirm API contracts are consistent across the mobile client, Express backend, and FastAPI recommendation service.
- Detect regressions at every phase handoff instead of waiting for Day 30.

## 3. Test Scope

### In scope

- React Native navigation, screens, components, permissions, accessibility, and state handling.
- Express REST endpoints, validation, authentication, authorization, rate limiting, caching, and error responses.
- MySQL persistence, relationships, ownership rules, and migration/seed behavior.
- Weather-provider and maps-provider adapters, including timeout, malformed response, rate-limit, and unavailable-provider behavior.
- FastAPI rule engine, personalized recommendations, activity scores, plant-care advice, alerts, and grounded assistant responses.
- FCM notification creation, delivery handoff, read state, and deep links.
- Performance, reliability, security, and privacy checks described in the PRD and TRD.

### Out of scope for this iteration

- Public web dashboard.
- Monetization, advertising, social sharing, and multi-language localization.
- Provider-internal availability or correctness outside the data returned to WeatherWise AI.

## 4. Test Levels and Techniques

| Level | Main purpose | Examples | When used |
|---|---|---|---|
| Static checks | Find defects before execution | TypeScript checks, linting, API contract review, PR review | Every change |
| Unit tests | Verify isolated rules and utilities | Threshold boundaries, serializers, validators, score calculations | Every rule/service change |
| Component tests | Verify mobile UI behavior in isolation | Loading/error states, advice cards, accessible labels | Every screen/component change |
| API/integration tests | Verify endpoint, database, and service contracts | Auth, CRUD ownership, cache fallback, error shape | Every backend/AI endpoint change |
| End-to-end tests | Verify user journeys across layers | Onboarding, home weather, travel comparison, alert deep link | Each phase and Day 29/30 |
| Exploratory tests | Find unexpected usability and integration issues | Device rotation, interrupted network, unusual locations | Each handoff and release candidate |
| Non-functional tests | Verify quality attributes | Accessibility, security, performance, offline behavior | Phase gates and Day 30 |

## 5. Environments and Tools

| Environment | Purpose | Required configuration |
|---|---|---|
| Local | Unit, component, API, and developer checks | Node.js 20+, mobile dependencies, isolated test database, mocked providers |
| Shared staging | Cross-team integration and E2E | HTTPS, seeded test users, sandbox provider credentials, test FCM project |
| Demo/release candidate | Final regression and presentation validation | Production-like configuration with test accounts and monitored logs |

Planned tooling:

- Postman collection for API smoke, positive, negative, authentication, and rate-limit cases.
- Jest or the team's selected JavaScript test runner for backend and mobile unit/component tests.
- FastAPI's pytest-based tests for recommendation and assistant behavior.
- A device/emulator matrix covering at least one Android and one iOS target, plus a narrow-screen device.
- Network throttling or request mocking for offline, timeout, and stale-cache scenarios.

The Day 1 backend skeleton currently has no test script or test files. The baseline smoke checks below use the running Express service; automated test-runner setup is scheduled before feature endpoints are merged.

### Day 1 baseline status

| Area | Status | Evidence or limitation |
|---|---|---|
| Backend process starts | Passed | `npm start` starts `src/server.js` with the documented local configuration. |
| Root service information | Passed | `GET /` returns the service name, running status, and health path. |
| Health endpoint | Passed | `GET /api/v1/health` returns HTTP 200 and a JSON status of `ok`. |
| Unknown-route handling | Passed | An unregistered route returns HTTP 404 with the standard `{ error: { code, message } }` shape. |
| Security headers | Passed | Helmet is registered in the Express app. |
| Automated test runner | Pending | No test files or `test` script exist in the Day 1 skeleton. |
| Feature requirements FR-01 to FR-20 | Not executable yet | The corresponding mobile, backend, database, provider, and AI features are scheduled for later implementation days. |

## 6. Test Data and Fixtures

Use deterministic fixtures so advice and alert results can be reproduced. Do not use real user credentials, real precise home locations, or production provider keys.

| Fixture | Representative values | Purpose |
|---|---|---|
| `user.standard` | `qa.standard@example.test`, metric units, walking | Baseline authenticated user |
| `user.runner` | Running preference, preferred time 17:00, high cold tolerance | Personalization and activity tests |
| `user.second` | Separate account with separate locations | Authorization and data-isolation tests |
| `location.home` | Test coordinates, label Home, default true | Current weather and default selection |
| `location.destination` | Different test coordinates, label Travel | Travel comparison |
| `weather.clear` | 22 C, low rain chance, moderate wind, UV 3 | Safe baseline |
| `weather.heat` | 36 C, UV 9, low humidity | Heat, hydration, sunscreen |
| `weather.rain` | Heavy rain, 85% probability, heavy intensity | Rain advice and alert |
| `weather.storm` | Thunderstorm condition, severe severity | Safety alert and notification |
| `weather.wind` | Wind at the strong-wind threshold | Boundary and strong-wind behavior |
| `weather.cold` | Temperature below cold threshold | Cold advice |
| `weather.missing` | Optional provider fields absent | Partial-data resilience |
| `provider.timeout` | Delayed response beyond client timeout | Retry and cache fallback |
| `provider.invalid` | Malformed or schema-incompatible response | Adapter validation |
| `plant.tomato` | Recently watered, rain forecast | Watering recommendation |
| `plant.dry` | Not recently watered, hot/dry forecast | Water-now recommendation |

Every fixture must state its timezone and units. Threshold values must come from the implemented rule configuration, not be duplicated in test code.

## 7. Entry, Exit, and Defect Rules

### Entry criteria

- Requirement or acceptance criteria is identified.
- API request and response shape is documented for endpoint work.
- Test data and provider mocks are available.
- The changed code builds or starts in the target environment.

### Exit criteria

- All planned P0 and P1 cases pass.
- No open blocker or critical defect remains.
- Failed cases have a defect ID, reproducible steps, evidence, and owner.
- Regression results and known limitations are recorded.
- For release, all FR-01 to FR-20 acceptance paths are demonstrated on a supported device.

### Severity and priority

| Severity | Meaning | Typical response |
|---|---|---|
| Blocker | Build cannot run, data is corrupted, or a safety/security path is unusable | Stop testing; fix before merge/release |
| Critical | Wrong severe-weather advice/alert, authentication bypass, or major data loss | Fix before release; immediate owner assignment |
| Major | Core feature fails or has no usable recovery path | Fix before phase completion |
| Minor | Limited defect with workaround or cosmetic issue | Schedule and track |

Test priority uses `P0` for safety, security, data integrity, and core journey cases; `P1` for normal feature behavior and important recovery paths; `P2` for secondary polish and low-risk edge cases.

## 8. Test Case Catalogue

Test case IDs are stable and should be reused in Postman, automated tests, and defect reports.

### 8.1 Foundation, authentication, and locations

| ID | Req | Priority | Test case and expected result |
|---|---|---:|---|
| TC-001 | FR-01 | P0 | Grant location permission on first launch. The app records the current location and continues to Home without repeated prompts. |
| TC-002 | FR-01 | P1 | Deny location permission. Manual location search is offered, the app remains usable, and permission can be revisited in settings. |
| TC-003 | FR-02 | P0 | Open Home with a granted/default location. Current weather is loaded for that location and no unrelated location is shown. |
| TC-004 | FR-16 | P0 | Add, select, rename, and delete saved locations. The selected location persists and one default location rule is maintained. |
| TC-005 | FR-16 | P0 | Attempt to read or modify another user's location by ID. The API rejects the request and reveals no other user's data. |
| TC-006 | Auth | P0 | Register with valid data, duplicate email, invalid email, blank required field, and weak/invalid password. Valid input succeeds; invalid input returns field-level errors without storing a password. |
| TC-007 | Auth | P0 | Login with valid and invalid credentials, then use an expired or malformed JWT. Valid login returns a token; invalid or expired sessions receive the standard error and protected routes reject access. |

### 8.2 Current weather, forecast, and cache

| ID | Req | Priority | Test case and expected result |
|---|---|---:|---|
| TC-008 | FR-03 | P0 | Load current weather with a complete provider response. Temperature, feels-like, humidity, wind, pressure, visibility, UV, sunrise, and sunset display with correct units. |
| TC-009 | FR-03 | P1 | Load a response with optional fields missing or extreme valid values. The UI remains stable, labels missing values clearly, and no invalid number is displayed. |
| TC-010 | FR-04 | P0 | Request hourly and seven-day forecast. Entries are ordered by time, use the requested location/timezone, and show the expected number of periods. |
| TC-011 | FR-05 | P0 | Use forecasts with no rain, moderate rain, and high-probability heavy rain. Probability, timing, and intensity match the response and use a clear empty state when unavailable. |
| TC-012 | NFR reliability | P0 | Make the provider timeout, return 5xx, return 429, and return malformed data. Cached data is shown with its last-updated time when available; otherwise a retryable error is shown. |
| TC-013 | NFR performance | P1 | Load Home with warm and cold cache. Record time to useful weather content and confirm cache reduces repeat provider requests without displaying expired data silently. |

### 8.3 Smart advice and safety

| ID | Req | Priority | Test case and expected result |
|---|---|---:|---|
| TC-014 | FR-06 | P0 | Run clear, heat, rain, storm, wind, cold, high-UV, and hot/dry fixtures. Advice includes the correct clothing, umbrella, hydration, sunscreen, activity, and plant-related actions. |
| TC-015 | FR-06 | P0 | Expand an advice item. The UI shows the triggering weather factors and recommendation reasoning, with no contradiction between summary and detail. |
| TC-016 | FR-07 | P0 | Test heat and UV values below, at, and above configured thresholds. Hydration, sunscreen, shade, and activity guidance appear only when appropriate and include severity text. |
| TC-017 | FR-08 | P0 | Test heavy rain below and above threshold, including forecast-only rain. The warning, umbrella/travel guidance, timing, and severity are correct. |
| TC-018 | FR-09 | P0 | Provide thunderstorm conditions. A severe alert explains the condition and recommends avoiding exposed/open areas; a duplicate alert is not created on refresh. |
| TC-019 | FR-10 | P0 | Test wind below, at, and above the configured threshold. Strong-wind guidance and activity/travel risk are correct at the boundary. |
| TC-020 | FR-11 | P0 | Test cold below, at, and above the configured threshold. Warm-clothing guidance is correct and respects the user's cold-tolerance preference. |
| TC-021 | FR-13 | P1 | Calculate walking, running, and cycling scores for safe, marginal, and unsafe conditions. Scores, factors, and best-time suggestion are consistent and explainable. |
| TC-022 | FR-20 | P1 | Change activity, time, units, and cold-tolerance preferences. The dashboard and advice reflect the saved values without changing another user's results. |

### 8.4 Travel, plants, map, notifications, and history

| ID | Req | Priority | Test case and expected result |
|---|---|---:|---|
| TC-023 | FR-12, FR-17 | P0 | Compare current and destination locations under low, medium, and high-risk fixtures. The response returns the correct risk level, score, major factors, and optional better departure time. |
| TC-024 | FR-14 | P1 | Add, view, update, and delete a plant. Watering advice reflects species, last-watered time, temperature, and forecast rain. |
| TC-025 | FR-14 | P1 | Test dry/hot, rain expected, and recently watered plant fixtures. Results are water now, skip, or water later as appropriate and include reasoning. |
| TC-026 | FR-15 | P1 | Open the weather map, pan, zoom, toggle rain/wind overlays, and tap a point. The map remains responsive and the point summary matches the selected coordinates. |
| TC-027 | FR-18 | P0 | Generate a severe-weather notification with notifications enabled and disabled. Enabled users receive one correctly worded notification; disabled users receive none. |
| TC-028 | FR-18 | P0 | Tap a notification while the app is closed, backgrounded, and open. Each state deep-links to the correct alert or feature and preserves authentication behavior. |
| TC-029 | FR-19 | P1 | Request daily and weekly history with no data, one day, and a full period. Summaries and trends are ordered, accurate, and have a useful empty state. |

### 8.5 AI assistant and cross-cutting behavior

| ID | Req | Priority | Test case and expected result |
|---|---|---:|---|
| TC-030 | AI / FR-20 | P0 | Ask a weather-specific question such as whether a run is suitable at a given time. The response uses the supplied current/forecast context, gives a direct answer, and includes reasoning. |
| TC-031 | AI | P0 | Ask an unrelated or unsupported question, omit weather context, and send an empty/oversized prompt. The assistant stays within scope, explains missing context, and applies input limits without crashing. |
| TC-032 | AI reliability | P0 | Make the AI service unavailable, slow, or return an invalid response. The backend returns the standard error shape and the mobile UI offers a clear recovery path. |
| TC-033 | NFR usability | P1 | Exercise loading, empty, error, offline, and stale-data states for Home, Forecast, Safety, Travel, Plants, and Assistant. Each state has the documented message and one sensible next action. |
| TC-034 | NFR accessibility | P0 | Navigate core flows with a screen reader and keyboard/switch equivalent where supported. Labels, focus order, touch targets, contrast, and non-color severity indicators meet the UI/UX brief. |
| TC-035 | NFR security | P0 | Inspect logs, client bundles, network responses, and error messages. Passwords, JWT secrets, provider keys, and precise data belonging to other users are not exposed. |
| TC-036 | NFR security | P0 | Send SQL injection strings, invalid types, oversized payloads, path traversal values, repeated login attempts, and excessive assistant requests. Inputs are rejected safely and rate limits are enforced. |

## 9. Traceability Summary

| Requirement group | Covered by |
|---|---|
| FR-01 Location Permission | TC-001, TC-002 |
| FR-02 Automatic Home Weather | TC-003, TC-013 |
| FR-03 Current Weather | TC-008, TC-009 |
| FR-04 Forecast | TC-010 |
| FR-05 Rain Prediction | TC-011, TC-017 |
| FR-06 Weather-Based Advice | TC-014, TC-015 |
| FR-07 Heat Warning | TC-016 |
| FR-08 Heavy Rain Warning | TC-017 |
| FR-09 Thunderstorm Warning | TC-018 |
| FR-10 Strong Wind Warning | TC-019 |
| FR-11 Cold Weather Warning | TC-020 |
| FR-12 Travel Safety | TC-023 |
| FR-13 Outdoor Activity Score | TC-021 |
| FR-14 Plant Care | TC-024, TC-025 |
| FR-15 Weather Map | TC-026 |
| FR-16 Multiple Locations | TC-004, TC-005 |
| FR-17 Destination Weather | TC-023 |
| FR-18 Notifications | TC-027, TC-028 |
| FR-19 Weather History | TC-029 |
| FR-20 Personalized Dashboard | TC-022, TC-030 |

## 10. Postman Collection Structure

Create the Day 1 Postman collection with these folders and environment variables:

```text
WeatherWise AI API
  00 Health and service info
  01 Auth
  02 Locations
  03 Weather and forecast
  04 Advice and alerts
  05 Travel, plants, and history
  06 Assistant and preferences
  07 Negative, security, and rate-limit checks

Variables:
  baseUrl
  accessToken
  secondUserToken
  locationId
  destinationLocationId
  plantId
  alertId
```

Each request should assert the status code, response content type, required response keys, standard error shape `{ error: { code, message } }`, and ownership behavior where authentication is required. Provider calls should be mocked in collection runs so tests are deterministic and do not consume rate limits.

## 11. QA Execution Checklist

### Every feature handoff

- [ ] Requirement ID and acceptance criteria are linked in the pull request.
- [ ] Test cases are updated or added for the changed behavior.
- [ ] Positive, boundary, invalid-input, empty, loading, error, and offline paths were considered.
- [ ] Unit/component/API checks pass locally.
- [ ] API response shape and error shape match the documented contract.
- [ ] Authenticated data is isolated to the current user.
- [ ] Logs contain no passwords, tokens, provider keys, or unnecessary precise location data.
- [ ] Accessibility labels, contrast, touch targets, and non-color status cues are checked for UI changes.
- [ ] Screenshots, request/response evidence, or test output is attached for UI/API changes.
- [ ] Known limitations and deferred defects are recorded with owner and severity.

### Phase regression

- [ ] Foundation: register, login, permission fallback, saved locations, and health endpoint.
- [ ] Core Weather: current conditions, hourly forecast, multi-day forecast, rain data, cache, and provider failure.
- [ ] Smart Recommendations: all condition categories, reasoning, scores, personalization, and AI-unavailable state.
- [ ] Safety: alert thresholds, severity labels, de-duplication, notification delivery, read state, and deep links.
- [ ] Travel, Plants, and Maps: comparison, risk factors, plant CRUD/watering, overlays, map interactions, and performance.
- [ ] Personalization and AI: preferences, grounded answers, prompt validation, history, and seed data.
- [ ] Regression defects from the previous phase are retested and closed.

### Day 29 integration gate

- [ ] Mobile, Express, database, weather provider, maps provider, FCM, and AI service use compatible contracts.
- [ ] All FR-01 to FR-20 primary paths are reachable end to end.
- [ ] JWT expiry and intended-screen return behavior work across protected flows.
- [ ] Cached-versus-live behavior is visible and correct.
- [ ] Timezone, units, rounding, and forecast ordering are consistent across services.
- [ ] Provider failures degrade gracefully without blank screens or crashes.

### Day 30 release gate

- [ ] All P0 and P1 cases pass on the supported Android/iOS test matrix.
- [ ] No open blocker or critical defect remains.
- [ ] Functional, API, security, accessibility, performance, offline, and notification checks are complete.
- [ ] Cold-start and cached Home load timings are recorded against the agreed target.
- [ ] App permissions, privacy messaging, notification behavior, and logout are verified.
- [ ] Release build installs, launches, and can complete the demo journey from a clean state.
- [ ] Test report, defect summary, known limitations, and sign-off are stored with the release candidate.

## 12. Test Execution Record

### Completed Day 1 smoke run

| Field | Value |
|---|---|
| Run ID / date | DAY1-SMOKE / 2026-09-06 |
| Build or commit | Local Day 1 backend skeleton |
| Environment/device | Windows local development environment; Node.js 20+ target |
| Tester | Testing rotation |
| Cases executed | Backend startup, `GET /`, `GET /api/v1/health`, unknown route, JSON error shape, security middleware registration |
| Passed / failed / blocked | 6 passed / 0 failed / 30 not executable |
| Defect IDs | None raised from the Day 1 smoke scope |
| Evidence location | `backend/README.md`, `backend/src/app.js`, `backend/src/routes/index.js`, `backend/src/routes/health.routes.js`, `backend/src/middleware/error-handler.js` |
| Sign-off | Day 1 QA baseline complete; feature testing remains gated on implementation |

The six passed checks are the five explicit baseline areas above, with the unknown-route response and standard error shape verified as separate assertions. The remaining catalogue cases are planned tests, not falsely reported execution results.

### Reusable execution record

For each later run, record:

| Field | Value |
|---|---|
| Run ID / date |  |
| Build or commit |  |
| Environment/device |  |
| Tester |  |
| Cases executed |  |
| Passed / failed / blocked |  |
| Defect IDs |  |
| Evidence location |  |
| Sign-off |  |

## 13. Day 1 Decisions and Follow-up Owners

| Decision or follow-up | Day 1 disposition | Owner / due point |
|---|---|---|
| JavaScript test runner | Use Jest or the team's agreed equivalent; add the runner and `npm test` script before the first feature endpoint merge. | Backend owner / before Day 2 auth work |
| FastAPI test runner | Use pytest with deterministic rule-engine fixtures. | AI owner / before first AI rule merge |
| Weather-rule thresholds | Keep thresholds in one shared rule configuration and have boundary tests read from that source. | AI owner / before Day 3 rule tests |
| Supported mobile matrix | Minimum: one Android emulator/device, one iOS simulator/device, and one narrow-screen target; record exact OS versions at setup. | Frontend owner / before first mobile release candidate |
| Performance targets | Agree and record measurable cold-start, cached Home, API, and assistant response targets before performance testing begins. | Full team / before Day 10 regression |
| External providers and mocks | Use sandbox/test credentials and mocked provider responses for automated tests; reserve live-provider checks for staging. | Backend and AI owners / before first integration test |
| Database choice | MySQL is the confirmed project database. Schema and database test fixtures must use the MySQL connection and SQL behavior. | Backend owner / before Day 2 schema work |

These are recorded decisions and follow-up gates rather than blockers for completing the Day 1 test strategy document. Any overdue item must be tracked as a release risk.
