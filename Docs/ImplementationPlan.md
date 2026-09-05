# WeatherWise AI
### Implementation Plan
*What are we doing during the 30 days?*

| Field | Detail |
|---|---|
| Project | WeatherWise AI (Smart Weather Assistant) |
| Document | 06 of 6 - Implementation Plan |
| Team | Shavi, Rahavi, Danu, Ruvethika |
| Version | 1.0 |
| Status | Draft for team review |

## 1. Purpose

This plan turns the 30-day roadmap into day-by-day tasks, each assigned according to the team's rotating-responsibility model. Every member cycles through Frontend, Backend, AI, and Testing on a repeating 4-day pattern, so the same four people cover every part of the system by Day 28. Days 29 and 30 break from the rotation for full-team integration and final testing/deployment.

## 2. Rotation Pattern (repeats every 4 days, Days 1–28)

| Cycle Day | Frontend | Backend | AI | Testing |
|---|---|---|---|---|
| 1st day of cycle | Shavi | Rahavi | Danu | Ruvethika |
| 2nd day of cycle | Rahavi | Danu | Ruvethika | Shavi |
| 3rd day of cycle | Danu | Ruvethika | Shavi | Rahavi |
| 4th day of cycle | Ruvethika | Shavi | Rahavi | Danu |

Applied to the calendar: Day 1, 5, 9, 13, 17, 21, 25 use the 1st-day pattern; Day 2, 6, 10... use the 2nd-day pattern, and so on.

## 3. Phase-by-Phase Day Plan

### Phase 1 — Foundation (Days 1–5)
Set up the mobile app, backend, database, and AI service skeletons; get authentication, saved locations, and the first weather-provider connection working end-to-end.

| Day | Frontend | Backend | AI | Testing |
|---|---|---|---|---|
| Day 1 | Shavi — RN scaffold, nav shell, design tokens | Rahavi — Express + PostgreSQL setup | Danu — FastAPI service scaffold | Ruvethika — Test framework + Postman skeleton |
| Day 2 | Rahavi — Login/Register screens + auth wiring | Danu — User table + auth endpoints | Ruvethika — Rule-engine data model (thresholds) | Shavi — Register/login test cases |
| Day 3 | Danu — Home Dashboard shell (placeholders) | Ruvethika — Location table + CRUD endpoints | Shavi — Heat + rain rules + tests | Rahavi — Location CRUD test cases |
| Day 4 | Ruvethika — Location permission + manual search | Shavi — Weather adapter + `/weather/current` stub | Rahavi — Wind/storm/cold/UV rules + tests | Danu — Weather adapter + failure tests |
| Day 5 | Shavi — Tab navigation polish | Rahavi — Validation, error format, rate limits | Danu — Single `/advice` endpoint wiring | Ruvethika — Foundation regression pass |

### Phase 2 — Core Weather (Days 6–10)
Deliver full current-conditions, hourly, and multi-day forecast features, backed by cached weather-provider data.

| Day | Frontend | Backend | AI | Testing |
|---|---|---|---|---|
| Day 6 | Rahavi — Weather Details screen | Danu — `/weather/current` + snapshot cache | Ruvethika — Rules consume live payloads | Shavi — Test `/weather/current` edge cases |
| Day 7 | Danu — Hourly Forecast strip | Ruvethika — `/weather/forecast` hourly + cache | Shavi — Rain-timing aware advice logic | Rahavi — Test hourly forecast + caching |
| Day 8 | Ruvethika — Multi-Day Forecast + Day Detail | Shavi — `/weather/forecast` daily + Day Detail | Rahavi — Multi-day trend awareness | Danu — Test multi-day + Day Detail |
| Day 9 | Shavi — Rain-probability indicators | Rahavi — Rain fields in forecast response | Danu — Tune rain-probability thresholds | Ruvethika — Test rain display end-to-end |
| Day 10 | Rahavi — Loading/error/offline polish | Danu — Scheduled cache-refresh job | Ruvethika — Refine outputs with real data | Shavi — Core Weather regression pass |

### Phase 3 — Smart Recommendations (Days 11–15)
Build the Smart Advice engine and UI — clothing, umbrella, hydration, and outdoor activity scoring — as an explainable, unified feature.

| Day | Frontend | Backend | AI | Testing |
|---|---|---|---|---|
| Day 11 | Danu — Smart Advice dashboard cards | Ruvethika — `/advice/today` endpoint (proxy AI) | Shavi — Clothing + umbrella logic | Rahavi — Test clothing/umbrella scenarios |
| Day 12 | Ruvethika — Advice Detail w/ reasoning | Shavi — Persist advice for history/debug | Rahavi — Hydration/sunscreen logic (heat+UV) | Danu — Test hydration/sunscreen scenarios |
| Day 13 | Shavi — Activity Score UI + best time | Rahavi — Activity-score data plumbing | Danu — Outdoor Activity Score logic | Ruvethika — Test Activity Score accuracy |
| Day 14 | Rahavi — Wire cards to `/advice` endpoint | Danu — Cache `/advice/today` responses | Ruvethika — Unified explainable advice payload | Shavi — Test combined `/advice/today` e2e |
| Day 15 | Danu — Polish severity/color styling | Ruvethika — Harden AI-unavailable error handling | Shavi — Tune thresholds from feedback | Rahavi — Smart Recommendations regression pass |

### Phase 4 — Safety (Days 16–20)
Implement severe-weather detection and the Safety Center, with explainable alerts and push notifications.

| Day | Frontend | Backend | AI | Testing |
|---|---|---|---|---|
| Day 16 | Ruvethika — Safety Center screen | Shavi — `/alerts` endpoint (active + reasons) | Rahavi — Heat + heavy-rain alert rules | Danu — Test alerts per condition type |
| Day 17 | Shavi — Alert Detail screen | Rahavi — Alert-generation vs thresholds | Danu — Thunderstorm + strong-wind rules | Ruvethika — Test push delivery + deep link |
| Day 18 | Rahavi — Home alert banner | Danu — FCM push wiring | Ruvethika — Cold + high-UV rules | Shavi — Test de-dup + severity scoring |
| Day 19 | Danu — Notification tap-through deep link | Ruvethika — Notification table/endpoints | Shavi — Severity scoring across alerts | Rahavi — Test notification read/unread |
| Day 20 | Ruvethika — Empty state + severity polish | Shavi — Alert de-duplication | Rahavi — Review explanation wording | Danu — Safety regression pass |

### Phase 5 — Travel, Plants & Maps (Days 21–25)
Add travel risk comparison, the interactive weather map, and plant-care watering recommendations.

| Day | Frontend | Backend | AI | Testing |
|---|---|---|---|---|
| Day 21 | Shavi — Travel & Map tab shell | Rahavi — `/travel/compare` endpoint | Danu — Travel risk-scoring rules design | Ruvethika — Test travel comparison accuracy |
| Day 22 | Rahavi — Travel Risk Result card | Danu — Risk scoring plumbing + persistence | Ruvethika — Risk level + factor explanations | Shavi — Test risk level + explanations |
| Day 23 | Danu — Weather Map w/ overlays | Ruvethika — Maps provider integration | Shavi — Suggested departure-time logic | Rahavi — Test map overlays accuracy/perf |
| Day 24 | Ruvethika — My Plants screen + add flow | Shavi — Plant table/endpoints (CRUD) | Rahavi — Plant watering rules | Danu — Test Plant CRUD + watering logic |
| Day 25 | Shavi — Polish + Multiple Locations mgmt | Rahavi — Watering-recommendation plumbing | Danu — Tune rules per species_type | Ruvethika — Travel/Plants/Maps regression pass |

### Phase 6 — Personalization & AI (Days 26–28)
Layer personalization on top of existing features and deliver the AI Weather Assistant and Weather History.

| Day | Frontend | Backend | AI | Testing |
|---|---|---|---|---|
| Day 26 | Rahavi — Preferences screen | Danu — UserPreference endpoints | Ruvethika — Wire preferences into thresholds | Shavi — Test preference effect on advice |
| Day 27 | Danu — AI Assistant chat screen | Ruvethika — `/assistant/ask` endpoint (proxy AI) | Shavi — AI Assistant NL Q&A logic | Rahavi — Test AI Assistant groundedness |
| Day 28 | Ruvethika — Weather History screen | Shavi — `/history` endpoint (aggregation) | Rahavi — Review end-to-end personalization | Danu — Test Weather History vs seed data |

## 4. Day 29 — Full Integration (All Team)

The rotation pauses; all four members work together to connect every module for the first time.

```
Frontend  <---->  Backend  <---->  Database
                      |
                      +----> Weather Provider API
                      +----> AI / Recommendation Engine
```

- Confirm every functional requirement (FR-01 through FR-20) is reachable end-to-end through the running app.
- Resolve integration defects that only appear once all modules are combined (auth tokens, response shape mismatches, timing issues).
- Freeze the feature set for Day 30 testing.

## 5. Day 30 — Final Testing & Deployment (All Team)

- Functional testing across all 20 functional requirements.
- AI testing: verify Smart Advice, alerts, and the AI Assistant remain accurate and explainable under real data.
- API and security testing: auth, input validation, rate limits.
- UI testing against the UI/UX Design Brief, including loading/empty/error states.
- Performance testing: cold-start time, cached vs live response times.
- Bug fixing, deployment of the demo build, final documentation pass, and rehearsal of the final presentation/demo.

## 6. Milestones & Deliverables

| Milestone | Day | Deliverable |
|---|---|---|
| Foundation complete | 5 | Auth, saved locations, and a working weather-provider connection. |
| Core Weather complete | 10 | Current conditions, hourly and multi-day forecasts live in-app. |
| Smart Recommendations complete | 15 | Smart Advice dashboard fully functional and explainable. |
| Safety complete | 20 | Severe-weather alerts and push notifications working end-to-end. |
| Travel/Plants/Maps complete | 25 | Travel risk comparison, weather map, and plant care live. |
| Personalization & AI complete | 28 | Preferences, AI Assistant, and Weather History live. |
| Full Integration | 29 | All modules connected and functioning together. |
| Final Demo Ready | 30 | Tested, deployed build and rehearsed presentation. |

## 7. Risks & Mitigation

- **Weather-provider rate limits:** mitigated by caching (WeatherSnapshot/ForecastCache) introduced from Phase 2 onward.
- **Role handoff friction from daily rotation:** mitigated by keeping the codebase modular (Section 5, TRD) and requiring PR review before merging.
- **AI service delays impacting other phases:** mitigated by building the rule engine early (Phase 1) behind a stable endpoint contract, so Frontend/Backend can integrate against it immediately.
- **Integration surprises on Day 29:** mitigated by keeping API contracts (Section 7, TRD) fixed from Phase 1 and testing each endpoint as it is built rather than only at the end.