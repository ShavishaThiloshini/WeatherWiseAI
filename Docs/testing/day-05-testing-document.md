# WeatherWise AI
## Day 05 Testing Document

| Field | Detail |
|---|---|
| Day | 05 |
| Scope | Foundation, authentication, dashboard, initial AI engine, first integration test |
| Test owner | Ruvethika - Testing |
| Status | Initial test pass completed; full cross-layer integration pending |
| Related code | `backend/`, `ai/`, `mobile/` |

## 1. Objective

Verify that the Day 05 deliverables are usable at their current integration boundaries:

- Backend foundation, authentication, and location ownership
- AI weather-to-recommendation engine
- Mobile authentication screen and basic Home Dashboard
- Initial automated integration checks

The full production flow is expected to become:

```text
Mobile -> Backend -> Weather data -> AI engine -> Backend -> Mobile
```

The backend-to-AI proxy and live weather source are not implemented in this iteration, so those checks are recorded as pending rather than marked as passed.

## 2. Test Environment

| Component | Environment |
|---|---|
| Backend | Node.js 20+, Express, port 3000 or test ports 3001-3003 |
| AI service | Python 3.14, FastAPI, port 8001 |
| Mobile | Expo / React Native, TypeScript |
| Database | MySQL when `DATABASE_URL` is configured; in-memory development fallback otherwise |
| Test data | Synthetic test users and test email addresses only |

## 3. Automated Test Commands

Run each command from the repository root using separate terminals or sequentially.

### Backend

```cmd
cd /d C:\Users\ruvet\WeatherWiseAI\backend
npm test
```

Expected current result:

```text
9 passed
0 failed
1 skipped when DATABASE_URL is not configured
```

Coverage includes:

- Health endpoint
- User registration
- Login and JWT creation
- Authenticated user profile
- Missing-user token rejection
- Location ownership and CRUD
- Coordinate validation
- Database schema checks

### AI engine

```cmd
cd /d C:\Users\ruvet\WeatherWiseAI\ai
python -m pytest
```

Expected current result:

```text
36 passed
```

Coverage includes:

- Health endpoint
- Heat and UV recommendations
- Rain rules and boundaries
- Thunderstorm safety recommendation
- Location-aware requirements
- Recommendation response contract
- Assistant deterministic fallback without Gemini

### Mobile type check

```cmd
cd /d C:\Users\ruvet\WeatherWiseAI\mobile
npx tsc --noEmit
```

Expected result: no compiler output and exit code 0.

## 4. Backend Manual Smoke Tests

Start the backend:

```cmd
cd /d C:\Users\ruvet\WeatherWiseAI\backend
npm start
```

Check health:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/v1/health
```

Expected response contains:

```json
{"status":"ok"}
```

Register a test user:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/api/v1/auth/register `
  -ContentType "application/json" `
  -Body '{"name":"QA User","email":"qa@example.test","password":"secret123"}'
```

Verify:

- HTTP 201 is returned.
- A token is returned.
- The password is not returned.
- The email is normalized to lowercase.

Then test login with the same credentials and use the returned token on:

```text
GET /api/v1/auth/me
```

Expected result: HTTP 200 with the authenticated user's id, name, and email.

Negative authentication cases:

| Case | Expected result |
|---|---|
| Missing email or password | HTTP 400, `VALIDATION_ERROR` |
| Password shorter than 6 characters | HTTP 400, `VALIDATION_ERROR` |
| Wrong password | HTTP 401, `INVALID_CREDENTIALS` |
| Missing bearer token | HTTP 401 |
| Token for missing user | HTTP 401, `USER_NOT_FOUND` |

## 5. AI Manual Smoke Test

Start the AI service:

```cmd
cd /d C:\Users\ruvet\WeatherWiseAI\ai
python -m uvicorn app:app --reload --port 8001
```

Send a heat and UV request:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8001/recommend `
  -ContentType "application/json" `
  -Body '{"temperature":36,"uv_index":9,"rain_probability":10,"wind_speed":8,"condition":"clear"}'
```

Expected result:

- HTTP 200
- `source` is `deterministic_rules`
- Hydration recommendation is present
- Heat risk is high or critical
- UV risk is high or critical
- Response includes `recommendations`, `alerts`, `analysis`, and `data_freshness`

Thunderstorm check:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8001/recommend `
  -ContentType "application/json" `
  -Body '{"temperature":24,"condition":"thunderstorm"}'
```

Expected result: severe outdoor warning and activity value `Avoid`.

## 6. Mobile Authentication Test Cases

Test on an Expo web build, Android emulator, iOS simulator, or physical device.

| ID | Test | Expected result | Status |
|---|---|---|---|
| AUTH-01 | Open login screen | Login form displays email and password fields | Pending manual |
| AUTH-02 | Submit empty email | Alert says a valid email is required | Pending manual |
| AUTH-03 | Submit invalid email | Alert says a valid email is required | Pending manual |
| AUTH-04 | Submit password shorter than 6 characters | Alert says password is too short | Pending manual |
| AUTH-05 | Toggle Register | Name field and account-creation labels appear | Pending manual |
| AUTH-06 | Register with valid data | Loading indicator appears; successful token authenticates user | Pending manual |
| AUTH-07 | Login with valid data | Loading indicator appears; successful token authenticates user | Pending manual |
| AUTH-08 | Login with invalid credentials | User-friendly error alert appears; app does not crash | Pending manual |
| AUTH-09 | Toggle password visibility | Password changes between hidden and visible text | Pending manual |
| AUTH-10 | Tap submit repeatedly | Button is disabled while request is in progress | Pending manual |
| AUTH-11 | Keyboard interaction | Inputs remain usable and submit controls are reachable | Pending manual |
| AUTH-12 | Accessibility scan | Inputs and buttons have meaningful labels and roles | Pending manual |

The mobile client currently uses `http://127.0.0.1:3000/api/v1`. Use `10.0.2.2` for an Android emulator or the computer's LAN IP for a physical device.

## 7. Home Dashboard Test Cases

| ID | Test | Expected result | Status |
|---|---|---|---|
| HOME-01 | Open Home screen | Header, location, weather card, metrics, advice, activity, plants, and alerts sections display | Implemented |
| HOME-02 | Location permission granted | Current location is displayed | Pending manual |
| HOME-03 | Location permission denied | Error message and retry control display | Implemented |
| HOME-04 | Scroll dashboard | All sections remain reachable without layout crash | Pending manual |
| HOME-05 | Render weather metrics | Temperature, humidity, wind, UV, and rain values display | Implemented with mock data |
| HOME-06 | Render smart advice | Clothing, umbrella, and hydration cards display | Implemented with mock data |
| HOME-07 | Render severe alert state | Alert or no-alert state is visible | Implemented with mock data |
| HOME-08 | Use live backend weather | Dashboard values match backend response | Pending; backend weather endpoint not implemented |
| HOME-09 | Use live AI recommendation | Advice matches AI response and severity | Pending; backend-to-AI proxy not implemented |

## 8. Cross-Layer Integration Checklist

```text
[x] Backend health and authentication tests run
[x] Backend ownership tests run
[x] AI recommendation tests run
[x] Mobile TypeScript validation runs
[ ] Mobile calls backend using a live authenticated session
[ ] Backend retrieves live weather data
[ ] Backend sends normalized weather to AI service
[ ] Backend validates and returns the AI response
[ ] Mobile renders live AI recommendations
[ ] Live MySQL schema test runs
[ ] Provider timeout and AI unavailable recovery are tested
```

## 9. Current Results and Defects

| Area | Result | Notes |
|---|---|---|
| Backend automated tests | Pass | 9 passed; live MySQL test skipped without `DATABASE_URL` |
| AI automated tests | Pass | 36 passed |
| Mobile type check | Pass | No TypeScript errors |
| Authentication implementation | Pass | Register, login, JWT, `/me`, and validation exist |
| Database implementation | Pass with limitation | MySQL path exists; live connection not verified |
| Home Dashboard | Partial | UI exists, but weather and advice remain mock/static |
| Backend-to-AI integration | Pending | No proxy route currently exists |
| Full end-to-end flow | Pending | Mobile, backend, weather, and AI are not yet connected end to end |

## 10. Exit Criteria

Day 05 first integration testing can be signed off when:

- Backend tests pass with no unexpected failures.
- AI tests pass with no unexpected failures.
- Mobile TypeScript check passes.
- Manual authentication smoke tests are executed on one supported device or emulator.
- Known limitations are recorded and assigned to the next implementation day.

Full integration release criteria additionally require:

- A live MySQL test pass.
- A backend weather endpoint.
- A backend-to-AI proxy endpoint.
- Live dashboard rendering from backend data.
- Error handling for weather and AI service outage.
