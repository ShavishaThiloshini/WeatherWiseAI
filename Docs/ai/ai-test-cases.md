# WeatherWise AI
### AI engine sample cases

Automated coverage: `ai/test_engine.py` and `ai/test_app.py`.

## Case 1 — Comfortable day

Input: 22°C, 10% rain, 10 km/h wind, UV 4.

Expect: low/safe overall risk, normal clothing, Excellent/Good activity, no severe alerts.

## Case 2 — Hot day

Input: 36°C, feels-like 38°C, UV 9, humidity 70.

Expect: heat caution, hydration, sun protection, reduced activity.

## Case 3 — Heavy rain

Input: 90% rain, heavy intensity.

Expect: umbrella/raincoat, travel caution, Poor/Avoid activity.

## Case 4 — Thunderstorm

Input: `condition: thunderstorm`.

Expect: CRITICAL / danger outdoor warning, activity Avoid, alert present.

## Case 5 — Strong wind

Input: 45 km/h wind.

Expect: wind caution, activity not Excellent.

## Case 6 — Cold

Input: 8°C, feels-like 4°C.

Expect: warm clothing / cold caution.

## Case 7 — High UV

Input: UV 11, 24°C.

Expect: sun protection and shade guidance.

## Combined cases

- Hot + high humidity → elevated heat/hydration.
- Thunderstorm + heavy rain → storm still first; umbrella still allowed.
- Cold + strong wind → higher cold risk.
- Hot + rain → one clothing item (breathable + waterproof), not two opposing outfits.

## Missing data

- Missing temperature → skip heat, hydration, clothing; UV can still run.
- Invalid wind (< 0) → treat as missing; no wind warning.
- Low rain probability → no umbrella warning.
