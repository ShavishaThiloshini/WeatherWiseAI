# WeatherWise AI
### Priority and conflict resolution

## Priority

| Priority | Typical use | API `severity` |
|---|---|---|
| CRITICAL | Thunderstorm, extreme wind/heat exposure | danger |
| HIGH | Heavy rain, strong wind, high heat/UV | warning |
| MEDIUM | Moderate rain, warm caution, optional extra layers | warning |
| LOW | Light rain umbrella, mild cool jacket | info |
| INFO | Suitable-day summary | info |

Sort order: priority first, then category (outdoor → hydration → clothing → umbrella → travel → general).

## Precedence

```text
Critical safety
    ↓
High risk
    ↓
Moderate risk
    ↓
Comfort recommendations
    ↓
Convenience recommendations
```

If any recommendation is CRITICAL (priority or risk):

- Drop items flagged `encourage_outdoor` (for example “excellent day for activity”).
- Keep safety, clothing that does not encourage exposure, umbrella, and hydration.
- Activity suitability is independently forced to **Avoid** for thunderstorms.

The engine must not return both “great day for outdoor exercise” and “severe thunderstorm”.
