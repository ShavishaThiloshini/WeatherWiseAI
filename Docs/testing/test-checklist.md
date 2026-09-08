# WeatherWise AI
### Day 02 QA Checklists

| Field | Detail |
|---|---|
| Document | Reusable error-handling and integration checklists |
| Owner | Testing / QA — Shavisha |
| Use | Copy into the PR or feature ticket whenever a new feature is added |

---

## 1. Feature error-handling checklist

Use this for **every** new screen, endpoint, or rule. A feature is not ready for handoff until these are considered (implemented or explicitly deferred with an owner).

```text
[ ] Normal/success scenario works
[ ] Loading state works
[ ] Empty state works
[ ] Invalid input is handled
[ ] API failure is handled
[ ] Network failure is handled
[ ] Timeout is handled
[ ] Unexpected response is handled
[ ] User receives a meaningful error message
[ ] App does not crash
[ ] Existing features are not broken
```

### How to apply it

| Checkbox | Minimum evidence |
|---|---|
| Success | Happy-path screenshot or API response with required fields |
| Loading | Spinner/placeholder appears and disappears |
| Empty | Dedicated empty copy, not a broken layout |
| Invalid input | Client and/or 400 validation; no partial corrupt write |
| API failure | 4xx/5xx mapped to `ErrorView` or standard error JSON |
| Network failure | Offline message or cached data with timestamp |
| Timeout | Abort after agreed limit (mobile client currently 10s in `api.ts`) |
| Unexpected response | Null/extra fields do not crash; invalid AI payload discarded |
| Message | Human-readable; no stack traces, tokens, or provider keys |
| No crash | Exercise the failure on a device/emulator or automated test |
| No regression | Run the relevant section of [regression-checklist.md](regression-checklist.md) |

---

## 2. Integration testing checklist

Use this when a change crosses a layer boundary.

### Frontend → Backend

```text
[ ] Correct endpoint is called
[ ] Correct HTTP method is used
[ ] Request data is correct
[ ] Response is handled correctly
[ ] Error response is handled
```

Also confirm:

- [ ] JWT attached on protected routes; omitted on register/login
- [ ] Response mapped into shared TypeScript types without silent field loss
- [ ] Error shape `{ error: { code, message } }` is parsed (not only `response.ok`)

### Backend → Weather API

```text
[ ] Correct parameters are sent
[ ] Weather API response is received
[ ] Required fields are extracted
[ ] Invalid responses are handled
[ ] API failure is handled
```

Also confirm:

- [ ] Provider keys never returned to the client
- [ ] Units normalized (Celsius, km/h, rain %) before cache and AI
- [ ] Timeout, 429, and 5xx follow TRD: cache if valid, else `WEATHER_UNAVAILABLE`

### Backend → AI

```text
[ ] Correct weather data is sent
[ ] Required AI input fields exist
[ ] AI response is received
[ ] AI errors are handled
[ ] Recommendation format is valid
```

Also confirm:

- [ ] Canonical envelope from Recommendation Architecture (`request_id`, location, `current`, intent)
- [ ] FastAPI is not called with provider-specific field names
- [ ] Invalid AI JSON is not forwarded to mobile
- [ ] `source` and `data_freshness` preserved

### AI → Frontend

```text
[ ] Recommendation is correctly returned
[ ] Recommendation is displayed correctly
[ ] Safety warnings are clearly visible
[ ] Unexpected AI output does not break the UI
```

Also confirm:

- [ ] Severity `danger` / `warning` is visually and accessibly distinct
- [ ] `factors` available on detail expansion
- [ ] Stale advice past `valid_until` is not shown as current

---

## 3. Safety-critical extra checks

When the feature touches alerts or activity/travel advice, also tick:

```text
[ ] Positive case: warning appears at/above the configured threshold
[ ] Negative case: warning does not appear below the threshold
[ ] Simultaneous alerts: highest severity remains visible
[ ] Advice does not contradict a severe alert
[ ] Assistant/LLM cannot override a deterministic safety rule
```

---

## 4. Auth and privacy extra checks

When the feature stores or returns user data:

```text
[ ] Ownership: user cannot access another user's locations, plants, or history
[ ] Passwords and JWTs are not logged or shown in errors
[ ] Precise coordinates are not printed in user-facing advice text
```
