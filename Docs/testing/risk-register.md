# WeatherWise AI
### Day 02 Testing Risk Register

| Field | Detail |
|---|---|
| Document | Failure scenarios and architecture findings |
| Owner | Testing / QA — Shavisha |
| Related | [testing-strategy.md](testing-strategy.md), [test-scenarios.md](test-scenarios.md) |

Risks are **potential failures** to test against. Findings are **observed now** in the Day 01/02 codebase. Findings are recorded only; no drive-by rewrites of other rotations’ code.

Priority: **Critical** | **High** | **Medium**.

---

## 1. Testing Risks

### 1.1 Location risks

| Risk | Why it matters | Priority | Typical tests |
|---|---|---|---|
| User denies location permission | Home weather cannot auto-load; user must not be stuck | High | TS-002 |
| Location services are disabled | Same as deny, different OS dialog | High | TS-011 |
| Location cannot be detected | GPS indoor/timeout | High | TS-012 |
| Incorrect location is returned | Advice for the wrong city is a safety and trust issue | High | TS-013 |
| Location request takes too long | Spinner stuck; user thinks the app is frozen | High | TS-012, TS-041 |

### 1.2 Weather API risks

| Risk | Why it matters | Priority | Typical tests |
|---|---|---|---|
| API is unavailable | Core product fails | High | TS-004 |
| API returns an error | Must degrade, not crash | High | TS-015 |
| API response is delayed | Timeouts and retries | High | TS-016, TS-076 |
| API returns incomplete data | Missing UV/wind must not be treated as zero unsafely | High | TS-017 |
| API returns unexpected data | Schema drift | High | TS-018 |
| Weather data is outdated | User acts on stale storm/heat data | Critical | TS-020 |
| API rate limit is reached | Cascading failures and cost | High | TS-019 |

### 1.3 Backend risks

| Risk | Why it matters | Priority | Typical tests |
|---|---|---|---|
| Server unavailable | All authenticated features fail | High | TS-060 |
| Database unavailable | Auth, locations, cache fail | High | TS-061 |
| Invalid request | Corrupt data or 500s | High | TS-062 |
| Missing required data | Advice generated from empty context | Critical | TS-033, TS-054 |
| Server timeout | Especially weather + AI chain | High | TS-016, TS-036 |
| Unexpected server error | Must use standard error shape; no secrets | High | TS-059, TS-061 |

### 1.4 AI risks

| Risk | Why it matters | Priority | Typical tests |
|---|---|---|---|
| AI receives incomplete weather data | Unsafe or empty advice | Critical | TS-033 |
| AI produces an incorrect recommendation | User may go outdoors in a storm or skip hydration in heat | Critical | TS-006–TS-008, TS-026–TS-032 |
| AI produces contradictory recommendations | Trust and safety | Critical | TS-035, TS-073 |
| AI receives extreme/unusual weather | Rules or UI may break | Critical | TS-034 |
| AI recommendation does not match predefined safety rules | Contract vs implementation drift | Critical | TS-008, safety checklist |
| AI service becomes unavailable | Must fail closed, not invent advice | Critical | TS-036–TS-038 |

### 1.5 Frontend risks

| Risk | Why it matters | Priority | Typical tests |
|---|---|---|---|
| Weather cards fail to render | Home unusable | High | TS-044 |
| Loading state gets stuck | User cannot recover | High | TS-009, TS-041 |
| API error is not displayed | Silent failure | High | TS-042 |
| Empty data causes UI errors | Crash on `[]` / `null` | High | TS-043, TS-022 |
| Navigation fails | Features unreachable | High | TS-046, TS-047 |
| Long weather data causes layout problems | Alerts clipped | Medium | TS-045, TS-073 |

---

## 2. Day 02 architecture findings (do not silently rewrite)

These are QA observations for the team. Priority is the **testing/product** impact if unaddressed when features go live.

| ID | Finding | Why it matters | Priority |
|---|---|---|---|
| FIND-001 | Mobile `Recommendation` types (`clothing`, `umbrella`, …; severity `info`/`warning`/`danger`/`success`) do not match current FastAPI output (`heat_and_uv`, `rain`, …; severity `high`/`medium`/`low`). Canonical contract in Recommendation Architecture uses mobile-like categories and severities. | Integration will map incorrectly; safety UI may not highlight danger. | Critical |
| FIND-002 | FastAPI still accepts compact `WeatherInput` (`temperature`, `uv_index`, …) while Day 02 contract requires an envelope (`request_id`, `location`, `current`, `forecast`, `preferences`). | Express/AI integration tests will fail or send incomplete context (no forecast timing). | High |
| FIND-003 | Mobile `WeatherCondition` uses values such as `stormy`; AI thunderstorm detection looks for `"storm"` / `"thunder"` in `condition`. | Storm warnings may not fire if the backend forwards mobile enums unchanged. | Critical |
| FIND-004 | `weatherService` / `locationService` still return mocks; Home does not use `LoadingPlaceholder` / `ErrorView` for live fetch. Forecast mock hourly/daily arrays are empty. | TS-001–TS-005, TS-009 are not executable as user journeys yet. Easy to ship Home that always looks “healthy”. | High |
| FIND-005 | `api.ts` points at a placeholder host and has no JWT interceptor yet. Timeout is 10s — good baseline to test against. | Auth and error normalisation must be verified when wiring begins. | High |
| FIND-006 | Backend has health + error middleware only; no auth, weather, or AI proxy. | Most API/integration scenarios remain blocked; Day 1 smoke (health/404) still applies. | High |
| FIND-007 | Optional Gemini assistant can return free text; deterministic fallback returns the first rule message only. | Groundedness and safety-override tests (TS-039, TS-040, safety extra checks) are mandatory before relying on `/assistant`. | Critical |
| FIND-008 | Shared rule thresholds are still inline in `ai/app.py`, not a single config consumed by tests. Day 1 already flagged this. | Boundary tests (positive/negative) will drift if numbers are duplicated in QA docs. | High |

---

## 3. Highest-priority risks to watch first

1. **Stale or missing weather presented as current** (outdated cache, mock left in production UI).
2. **Wrong or missing severe-weather advice** (storm, heat, wind, heavy rain) including contract/enum mismatch (FIND-001, FIND-003).
3. **Contradictory advice** vs alerts; LLM inventing conditions.
4. **AI or weather outage** causing fabricated recommendations instead of a clear error.
5. **Auth/data isolation** once users and locations exist (cross-user location leak).
6. **Permission denied / no GPS** leaving the user with no way to get weather.

---

## 4. Risk review cadence

- Update this register when a phase ends (Days 5, 10, 15, 20, 25, 28) and when a Critical defect is found.
- Close a finding when the owning rotation implements the contract and QA retests the linked TS IDs.
