# WeatherWise AI
### Day 02 Regression Testing Plan

| Field | Detail |
|---|---|
| Document | Regression approach and per-handoff checklist |
| Owner | Testing / QA — Shavisha |
| Related | [testing-strategy.md](testing-strategy.md), [test-scenarios.md](test-scenarios.md), Implementation Plan |

---

## 1. Approach

Whenever a new feature is added:

```text
New Feature Test
       ↓
Integration Test
       ↓
Regression Test
       ↓
Existing Features Verified
```

New functionality must not break existing functionality. Run **new feature** tests first, then **one layer-boundary** integration pass, then the **phase smoke list** below.

Example: when the AI assistant is added later, still verify:

- Home weather still works
- Forecast still works
- Recommendations still work
- Navigation still works
- Saved locations still work
- Existing APIs still work

---

## 2. Always-on smoke (run when anything merges)

Tick only what exists in the current build. Do not mark unbuilt features as passed.

```text
[ ] App launches without crash
[ ] Bottom tabs open: Home, Forecast, Safety, Travel & Map, Profile
[ ] Nested routes: Travel → Map; Profile → Plants; Profile → Assistant
[ ] GET / returns service info (backend running)
[ ] GET /api/v1/health returns 200 / status ok
[ ] Unknown API route returns standard { error: { code, message } }
[ ] FastAPI GET /health returns ok (when AI service is running)
```

---

## 3. After auth / locations (Phase 1)

```text
[ ] Register and login happy path
[ ] Invalid login does not issue a token
[ ] Location permission grant and deny/fallback
[ ] Saved location add / select / default rule
[ ] User cannot access another user's location by ID
```

---

## 4. After core weather (Phase 2)

```text
[ ] Current weather for selected location
[ ] Hourly and multi-day forecast order and units
[ ] Rain probability empty vs present
[ ] Provider timeout / 5xx / malformed → cache or retry error
[ ] Stale cache is labelled (not shown as live)
[ ] Home loading / error / empty states
```

---

## 5. After smart recommendations (Phase 3)

```text
[ ] Clothing, umbrella, hydration cards match rules
[ ] Activity scores still calculate
[ ] Advice detail shows factors
[ ] AI/proxy unavailable path still recoverable
[ ] Home weather and forecast still render
```

---

## 6. After safety (Phase 4)

```text
[ ] Thunderstorm, heavy rain, wind, heat, cold, UV positive/negative cases
[ ] Alert de-duplication on refresh
[ ] Notification on/off
[ ] Deep link does not break auth or Home
[ ] Recommendations still consistent with alerts
```

---

## 7. After travel, plants, maps (Phase 5)

```text
[ ] Travel comparison score and factors
[ ] Plant CRUD and watering advice
[ ] Map still opens from Travel
[ ] Multiple locations still switch Home weather
[ ] Safety alerts still appear on Home/Safety
```

---

## 8. After personalization and assistant (Phase 6)

```text
[ ] Preferences change advice for that user only
[ ] Assistant grounded on supplied weather
[ ] Assistant failure fallback
[ ] History empty and populated
[ ] All previous phase smokes still pass
```

---

## 9. Day 29 / Day 30 gates

Reuse Day 1 integration and release gates in `Docs/TestStrategy.md` sections 11 (Day 29 / Day 30). Do not skip safety-critical cases to save time before demo.

---

## 10. Recording a regression run

| Field | Value |
|---|---|
| Run ID / date |  |
| Build or commit |  |
| Phase / trigger (e.g. “Day 7 hourly forecast”) |  |
| Environment / device |  |
| Tester |  |
| Checklists used |  |
| Passed / failed / blocked |  |
| Defect IDs |  |
| Sign-off |  |
