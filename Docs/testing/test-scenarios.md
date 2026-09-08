# WeatherWise AI
### Day 02 Initial Test Scenarios

| Field | Detail |
|---|---|
| Document | Initial executable scenario list (TS-xxx) |
| Owner | Testing / QA — Shavisha |
| Related | [testing-strategy.md](testing-strategy.md), `Docs/TestStrategy.md` (TC-001–TC-036) |

Scenarios below are **planned** unless marked otherwise. Features that are still placeholders (mock weather, no auth API, compact AI payload) are **blocked** until the owning rotation delivers them. IDs are stable: reuse them in Postman, pytest, and defect reports.

Priority: **Critical** | **High** | **Medium**.

---

## 1. Location

| ID | Area | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TS-001 | Location | Allow location permission | Current location is obtained and used for Home weather | High |
| TS-002 | Location | Deny location permission | User receives a clear fallback (manual search); app remains usable | High |
| TS-011 | Location | Location services disabled at OS level | Same usable fallback as deny; no crash | High |
| TS-012 | Location | Location cannot be detected / GPS timeout | Timeout message and retry or manual location | High |
| TS-013 | Location | Incorrect or stale coordinates returned | User can correct via saved/manual location; weather matches selected place | High |
| TS-014 | Location | User switches saved location | Home, forecast, and advice refresh for the new location only | High |

---

## 2. Weather API and current conditions

| ID | Area | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TS-003 | Weather API | API returns valid weather data | Weather data is displayed correctly for the selected location | High |
| TS-004 | Weather API | API unavailable | Friendly error state is displayed; retry available; no crash | High |
| TS-015 | Weather API | API returns error (4xx/5xx) | Standard error handling; cached data if valid, else retryable error | High |
| TS-016 | Weather API | API response delayed beyond timeout | Client/backend timeout path; no infinite spinner | High |
| TS-017 | Weather API | Incomplete payload (missing optional fields) | UI labels missing values; required-field failure does not show fake numbers | High |
| TS-018 | Weather API | Unexpected types / nulls | Validation rejects or sanitizes; UI does not crash | High |
| TS-019 | Weather API | Rate limit (429) | Backoff / cache / clear message; no request storm | High |
| TS-020 | Weather API | Outdated cached weather | Last-updated time shown; not presented as live | Critical |
| TS-021 | Current weather | Full current payload | Temperature, feels-like, humidity, wind, UV, rain, visibility (and later pressure/sunrise/sunset) render with correct units | High |

---

## 3. Forecast and rain

| ID | Area | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TS-005 | Forecast | Forecast data available | Hourly and multi-day forecast render in time order | High |
| TS-022 | Forecast | Forecast missing / empty | Empty state; Home still usable | High |
| TS-023 | Rain | 0% rain probability | No umbrella/heavy-rain warning from rain rules | High |
| TS-024 | Rain | 100% rain probability / heavy intensity | Rain timing, umbrella advice, and travel caution as per rules | High |
| TS-025 | Rain | Forecast-only rain (current dry, later wet) | Timing shown; advice reflects upcoming rain | High |

---

## 4. AI / recommendations (positive and negative)

| ID | Area | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TS-006 | AI | High temperature detected | Heat/hydration advice is generated; intense outdoor activity reduced | High |
| TS-007 | AI | Heavy rain detected | Rain/travel advice is generated (umbrella/raincoat) | High |
| TS-008 | AI | Thunderstorm detected | Outdoor safety warning is generated | Critical |
| TS-026 | AI | Moderate temperature (below heat threshold) | Heat warning does **not** appear | High |
| TS-027 | AI | Strong wind at/above threshold | Wind safety warning; travel/activity caution | Critical |
| TS-028 | AI | Wind below threshold | Strong-wind warning does **not** appear | High |
| TS-029 | AI | Cold temperature at/below threshold | Warm clothing recommendation | High |
| TS-030 | AI | Temperature above cold threshold | Cold-clothing warning does **not** appear | Medium |
| TS-031 | AI | High UV at/above threshold | Sunscreen / shade / protective clothing | High |
| TS-032 | AI | Low/moderate UV | High-UV warning does **not** appear | Medium |
| TS-033 | AI | Incomplete weather sent to AI | Request rejected or reduced safe output; no invented conditions | Critical |
| TS-034 | AI | Extreme values (e.g. 50°C, −20°C) | Advice remains rule-based and non-crashing; severity appropriate | Critical |
| TS-035 | AI | Contradictory recommendations | Defect if storm danger and “safe outdoor activity” both shown | Critical |
| TS-036 | AI | AI service unavailable | `AI_SERVICE_UNAVAILABLE` (or equivalent); cached valid advice or retry; no fabricated advice | Critical |
| TS-037 | AI | Invalid AI response body | Discarded; `AI_INVALID_RESPONSE`; UI recoverable | Critical |
| TS-038 | AI | Optional LLM unavailable | Deterministic fallback; `source` does not claim Gemini | High |
| TS-039 | AI | Assistant question with weather context | Answer uses supplied current/forecast only | High |
| TS-040 | AI | Assistant unrelated / empty / oversized prompt | Stays in scope; validation limits applied; no crash | High |

---

## 5. Frontend and UI

| ID | Area | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TS-009 | Frontend | API loading | Loading state is displayed | Medium |
| TS-041 | Frontend | Loading never completes | Timeout/error replaces spinner; user can retry | High |
| TS-042 | Frontend | API error | Error view with meaningful message; retry if applicable | High |
| TS-043 | Frontend | Empty weather/forecast | Empty view; no blank white crash | High |
| TS-044 | Frontend | Weather cards render with valid data | Hero, metrics, advice cards visible and consistent | High |
| TS-045 | Frontend | Long lists / long alert text | Scroll works; layout does not overflow unusable | Medium |
| TS-046 | Frontend | Tab navigation | Home, Forecast, Safety, Travel & Map, Profile all open | High |
| TS-047 | Frontend | Nested navigation | Travel → Map; Profile → Plants and AI Assistant | High |
| TS-048 | Frontend | Safety warnings visibility | Danger/warning severity is obvious (not color-only) | Critical |
| TS-049 | Frontend | Unexpected AI/API extra fields | UI ignores unknowns; does not crash | High |
| TS-050 | Frontend | App reopen after error | Recovers or shows last error with retry; no stuck overlay | High |
| TS-051 | Frontend | Accessibility smoke | Core labels and tap targets usable with screen reader | High |

---

## 6. Integration

| ID | Area | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TS-010 | Integration | Backend sends weather data to AI | AI receives the same normalized fields the backend stored/fetched | High |
| TS-052 | Integration | Frontend → Backend current weather | Correct endpoint, method, auth; response mapped to `WeatherData` | High |
| TS-053 | Integration | Backend → Weather provider | Correct lat/lon/units; required fields extracted | High |
| TS-054 | Integration | Backend → AI canonical envelope | `request_id`, location, current (and forecast when required) present | High |
| TS-055 | Integration | AI → Frontend display | Recommendation title/message/severity match AI output | High |
| TS-056 | Integration | Auth JWT on protected routes | Valid token succeeds; missing/expired token rejected uniformly | Critical |
| TS-057 | Integration | Location ownership | User A cannot read User B locations or plants | Critical |

---

## 7. Backend, auth, and data

| ID | Area | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TS-058 | Backend | Health endpoint | `GET /api/v1/health` returns 200 and `status: ok` | High |
| TS-059 | Backend | Unknown route | 404 with `{ error: { code, message } }` | High |
| TS-060 | Backend | Server unavailable | Mobile shows network error; no crash | High |
| TS-061 | Backend | Database unavailable | Controlled 5xx; no stack traces or secrets in body | High |
| TS-062 | Backend | Invalid / missing request body | 400 with field-level or standard error; no write | High |
| TS-063 | Auth | Register valid / duplicate / weak password | Success vs field errors; password never stored or logged in clear | Critical |
| TS-064 | Auth | Login valid vs invalid | Token issued only on success | Critical |

---

## 8. Travel, plants, map, notifications, history

| ID | Area | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TS-065 | Travel | Compare origin vs destination | Risk level, score, and factors match both weather sets | High |
| TS-066 | Travel | Unsafe destination weather | Travel score/warning discourages unnecessary travel | Critical |
| TS-067 | Plants | Hot/dry, not recently watered | Water-now (or equivalent) with reasoning | High |
| TS-068 | Plants | Rain expected / recently watered | Skip or water later; no contradiction | High |
| TS-069 | Map | Pan, zoom, overlay, tap point | Remains usable; summary matches tapped coordinates | Medium |
| TS-070 | Notifications | Severe alert, notifications on | One correctly worded notification | Critical |
| TS-071 | Notifications | Notifications disabled | No push sent | High |
| TS-072 | History | No history vs populated period | Empty state vs ordered accurate summaries | Medium |

---

## 9. Multiple simultaneous conditions

| ID | Area | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TS-073 | Safety | Storm + heavy rain + wind together | All relevant warnings shown; highest severity not hidden | Critical |
| TS-074 | Safety | Heat + high UV together | Hydration and UV/sun protection both present | High |

---

## 10. Network and device

| ID | Area | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TS-075 | Network | No internet | Offline/cache or clear error; no crash | High |
| TS-076 | Network | Very slow network | Loading then timeout/error; user can cancel/retry | High |
| TS-077 | Permissions | User denies then later grants in OS settings | App picks up permission on next request without crash | High |

---

## 11. Traceability notes

| TS IDs | Closest Day 1 cases / FRs |
| --- | --- |
| TS-001, TS-002, TS-011–TS-014 | TC-001, TC-002 / FR-01, FR-16 |
| TS-003, TS-004, TS-015–TS-021 | TC-008, TC-009, TC-012 / FR-02, FR-03 |
| TS-005, TS-022–TS-025 | TC-010, TC-011 / FR-04, FR-05 |
| TS-006–TS-008, TS-026–TS-040 | TC-014–TC-022, TC-030–TC-032 / FR-06–FR-14, FR-20 |
| TS-009, TS-041–TS-051 | TC-033, TC-034 |
| TS-010, TS-052–TS-057 | Integration + TC-005 |
| TS-058–TS-064 | Day 1 smoke + TC-006, TC-007 |
| TS-065–TS-072 | TC-023–TC-029 / FR-12, FR-14–FR-19 |
| TS-073–TS-077 | Safety + reliability NFRs |

---

## 12. Counts (Day 02 initial set)

| Category | Scenario IDs | Count |
| --- | --- | --- |
| Location | TS-001, TS-002, TS-011–TS-014 | 6 |
| Weather API / current | TS-003, TS-004, TS-015–TS-021 | 9 |
| Forecast / rain | TS-005, TS-022–TS-025 | 5 |
| AI / recommendations / assistant | TS-006–TS-008, TS-026–TS-040 | 18 |
| Frontend / UI | TS-009, TS-041–TS-051 | 12 |
| Integration | TS-010, TS-052–TS-057 | 7 |
| Backend / auth | TS-058–TS-064 | 7 |
| Travel / plants / map / notifications / history | TS-065–TS-072 | 8 |
| Multi-alert / network / permissions | TS-073–TS-077 | 5 |
| **Total** | TS-001–TS-010 plus TS-011–TS-077 | **77** |

Day 02 executable smoke (already true from Day 1, reconfirm when backend is running): TS-058, TS-059. AI pytest currently covers a subset of TS-006, TS-008, TS-038.
