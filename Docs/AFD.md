# WeatherWise AI
### App Flow Document
*How does the user move through the application?*

| Field | Detail |
|---|---|
| Project | WeatherWise AI (Smart Weather Assistant) |
| Document | 03 of 6 - App Flow Document |
| Team | Shavi, Rahavi, Danu, Ruvethika |
| Version | 1.0 |
| Status | Draft for team review |

## 1. Purpose

This document maps every path a user can take through WeatherWise AI, from first launch to daily returning use, including error and edge-case paths. It is the reference the Frontend rotation uses when wiring navigation, and the Testing rotation uses to define test cases.

## 2. Notation

Each flow is shown as an ordered sequence of screens/actions using "→" to mean "leads to", and branches are shown as indented alternatives.

## 3. Core Flows

### 3.1 First-Time User / Onboarding

```
Splash Screen
  -> Welcome / Onboarding Slides (what the app does)
  -> Create Account OR Continue as Guest
  -> Location Permission Request
       -> Granted  -> Home Dashboard (current location)
       -> Denied   -> Manual Location Search -> Home Dashboard
```

### 3.2 Register / Login

```
Welcome Screen
  -> Register (name, email, password)
       -> Success -> Location Permission -> Home Dashboard
       -> Failure (validation/duplicate email) -> Show inline error -> Retry
  -> Login (email, password)
       -> Success -> Home Dashboard
       -> Failure (invalid credentials) -> Show inline error -> Retry / Forgot Password
```

### 3.3 Home Dashboard

```
Home Dashboard
  -> Current weather summary (temperature, condition, humidity, UV, rain probability)
  -> Today's Smart Advice card (wear, umbrella, hydration, activity, travel, plants)
  -> Active Alerts banner (if any severe-weather alert is active)
  -> Tap weather summary   -> Weather Details Screen
  -> Tap Smart Advice item -> Smart Advice Detail Screen
  -> Tap Alert banner      -> Alert Detail Screen
  -> Bottom Tabs: Home | Forecast | Safety | Travel & Map | Profile
```

### 3.4 Weather Details & Forecast

```
Weather Details Screen
  -> Full current conditions (feels-like, wind, pressure, visibility, sunrise/sunset)
  -> Tap 'Forecast' tab
       -> Hourly Forecast (scrollable, next 24h)
       -> Multi-Day Forecast (7-day list)
       -> Tap a day -> Day Detail (hour-by-hour breakdown, rain timing)
```

### 3.5 Smart Advice

```
Smart Advice Detail Screen
  -> What to Wear
  -> Carry Umbrella? (yes/no + reasoning)
  -> Hydration / Sunscreen guidance
  -> Outdoor Activity Score (Walking / Running / Cycling) + best time suggestion
  -> Each item expandable to show the underlying condition that triggered it
```

### 3.6 Severe Weather Alerts

```
Alerts / Safety Center
  -> List of active alerts (Heat / Heavy Rain / Thunderstorm / Strong Wind / Cold)
  -> Tap an alert -> Alert Detail (why it was triggered, recommended action)
  -> No active alerts -> Empty state: 'No severe weather right now'
```

### 3.7 Travel Safety

```
Travel & Map Tab
  -> Enter Destination (search or map pin)
  -> Compare Current vs Destination Weather
  -> Risk Result: Low / Medium / High + contributing risk factors
  -> Suggested better departure time (if applicable)
  -> Save destination as a location (optional)
```

### 3.8 Plant Care

```
Profile -> My Plants
  -> Add Plant (name, type, location)
  -> Plant Card shows: Water Today? Yes / No / Water in the evening
  -> Tap plant -> Plant Detail (forecast reasoning behind the recommendation)
```

### 3.9 Weather Map

```
Travel & Map Tab -> Map View
  -> Interactive map with rain / wind / condition overlays
  -> Pan/zoom; tap a point -> mini weather summary for that point
```

### 3.10 Multiple Locations

```
Profile -> My Locations
  -> List of saved locations (Home, University, Workplace, Travel)
  -> Add Location -> Search / Pin on map -> Save with a label
  -> Tap a saved location -> Home Dashboard for that location
  -> Swipe to delete a saved location
```

### 3.11 AI Weather Assistant

```
Home Dashboard -> AI Assistant icon
  -> Chat-style input: 'Can I go for a run at 5 PM?'
  -> Assistant analyzes current + forecast + user profile
  -> Returns a direct, weather-aware answer with reasoning
  -> Suggested follow-up questions shown below the answer
```

### 3.12 Notifications

```
System Notification (severe weather / personalized alert)
  -> Tap notification -> Deep-links into Alert Detail or relevant screen
  -> In-app Notifications tab -> full notification history
```

### 3.13 Weather History

```
Profile -> Weather History
  -> Daily summaries list
  -> Weekly summary + simple trend view
  -> Tap a day -> that day's recorded conditions and advice given
```

## 4. Error & Edge-Case Flows

- **No internet connection:** show cached last-known weather with a clear "offline - showing last update" banner instead of a blank/broken screen.
- **Location permission denied:** fall back to manual location search; user can grant permission later from Profile > Settings.
- **Weather API failure:** show cached data if available, otherwise a friendly retry screen rather than raw error text.
- **Empty states:** no saved plants, no saved locations, and no active alerts each get a specific empty-state message and a clear next action (e.g. "Add your first plant").
- **Session expiry:** an expired JWT redirects to Login with the user's intended screen remembered, so they return to where they left off after re-authenticating.