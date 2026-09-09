# WeatherWise AI
### Day 03 Location-Aware Recommendation Requirements

| Field | Detail |
|---|---|
| Owner | Rakavi - AI |
| Deliverable | Location-aware recommendation requirements and contract |
| Status | Complete |
| Related | PRD FR-01, FR-02, FR-12, FR-16, FR-17, FR-20; TRD AI architecture |

## Purpose

Recommendations must be calculated for the location selected by the user. The AI service must never silently substitute a default or previously selected location.

## Location Context Contract

A recommendation request may include:

| Field | Required | Rules |
|---|---:|---|
| `id` | Recommended | Saved-location identifier used for traceability; must not be exposed to another user. |
| `label` | Recommended | Display label such as Home, University, Workplace, or Destination. |
| `latitude` | Required for coordinate-aware weather | Decimal from -90 to 90. |
| `longitude` | Required for coordinate-aware weather | Decimal from -180 to 180. |
| `timezone` | Required for time-sensitive advice | IANA timezone such as `Asia/Colombo`; used for forecast timing and sunrise/sunset. |

Weather values must belong to the same location context. The backend owns geocoding, saved-location authorization, and provider lookup; the AI service evaluates the supplied weather and location context only.

## Functional Requirements

- **LR-01 Selected location:** Apply recommendations to the requested saved location or explicit coordinates.
- **LR-02 No silent fallback:** If location context is missing, return a limitation or validation error; do not use a default location.
- **LR-03 Coordinate validation:** Reject or flag latitude/longitude outside valid ranges.
- **LR-04 Timezone awareness:** Preserve the IANA timezone so rain timing, sunrise/sunset, and activity advice can be displayed in local time.
- **LR-05 Location traceability:** Return a safe location context in the response: ID, label, coordinates, and timezone when supplied.
- **LR-06 Destination separation:** Current and destination weather must be sent as separate location contexts before travel advice is generated.
- **LR-07 Explainability:** Include the selected location label and weather factors in assistant context and recommendation evidence.
- **LR-08 Privacy:** Do not return a street address, user account data, or precise coordinates unless the caller supplied them and the client is authorized to receive them.

## Acceptance Criteria

1. A request for `Home` and a request for `Destination` return their own labels and coordinates.
2. An invalid coordinate produces a limitation and does not become a usable coordinate.
3. A missing envelope location returns HTTP 422 rather than producing advice for an unknown place.
4. Recommendations remain deterministic for identical weather and location inputs.
5. Timezone is returned unchanged for the mobile client to render local forecast times.
