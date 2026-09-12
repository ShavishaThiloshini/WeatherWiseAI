# Location Permission Test Cases

| Field | Detail |
|---|---|
| Scope | Device location permission and current-location weather flow |
| Owner | Ruvethika - Testing |
| Related code | `mobile/src/services/locationService.ts`, `mobile/src/screens/HomeScreen.tsx`, `mobile/src/screens/WeatherDetailsScreen.tsx` |
| Execution | Expo Android emulator, iOS simulator, or physical device |

## Test Cases

| ID | Scenario | Steps | Expected result | Status |
|---|---|---|---|---|
| LOC-01 | Permission granted | Open Home or Weather Details and allow foreground location access | The app requests the current position, loads weather, and does not show a permission error | Ready for device test |
| LOC-02 | Permission denied | Open the screen and select **Don't allow** | The app remains usable and shows a clear message explaining that location permission was denied, with a retry action where supported | Ready for device test |
| LOC-03 | Permission denied permanently | Deny permission, disable Location for the app in system settings, then tap retry | The app does not crash; it shows the same actionable location error | Ready for device test |
| LOC-04 | Retry after granting permission | Deny permission, enable it in system settings, then tap **Try Again** | The retry requests location again and the weather screen loads successfully | Ready for device test |
| LOC-05 | Position lookup failure | Grant permission, then test with device location services disabled or an unavailable emulator location | A user-facing loading/error state appears; no unhandled exception or blank screen | Ready for device test |
| LOC-06 | Reverse geocode unavailable | Grant permission while the provider returns no address fields | Weather still loads with `Current location` as the city fallback; the app does not crash | Covered by implementation; device/provider verification pending |
| LOC-07 | Reverse geocode partial address | Return only district, region, or country fields | The display name uses the available fallback fields and remains readable | Covered by implementation; device/provider verification pending |
| LOC-08 | Permission request affects all entry points | Repeat LOC-01 and LOC-02 from Home and Weather Details | Both screens use the shared location service and produce consistent results | Ready for device test |

## Implementation Evidence

- `getCurrentLocation()` requests foreground permission before reading coordinates.
- A non-granted status throws a user-readable permission error.
- Coordinates are obtained with balanced accuracy.
- Missing city data falls back through city, district, subregion, and `Current location`.
- Home and Weather Details expose loading/error states and retry behavior.
- Mobile TypeScript validation passes with `npx tsc --noEmit`.

## Execution Notes

These cases require Expo device or emulator controls and cannot be fully automated by the current mobile project because it has no test runner configured. Record the device, OS, permission choice, and result beside each case after execution. Do not use a real user's precise location in screenshots or test data.