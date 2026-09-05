# WeatherWise AI
### UI/UX Design Brief
*How should the application look and behave?*

| Field | Detail |
|---|---|
| Project | WeatherWise AI (Smart Weather Assistant) |
| Document | 04 of 6 - UI/UX Design Brief |
| Team | Shavi, Rahavi, Danu, Ruvethika |
| Version | 1.0 |
| Status | Draft for team review |

## 1. Purpose

This brief defines the visual language, components, and interaction patterns for WeatherWise AI so the Frontend rotation produces a consistent app regardless of who is on Frontend duty that day. It also sets the standard the Testing rotation checks UI work against.

## 2. Design Principles

- **Glanceable first:** the most important decision (what to wear, carry an umbrella, is it safe to go out) must be readable in under 3 seconds on the home screen.
- **Explain, don't just alert:** every warning or recommendation shows the reason behind it, not just a label.
- **Calm, not alarming:** severe-weather alerts use clear color coding without resorting to flashing or aggressive visuals.
- **Consistent iconography:** one icon per weather condition and one icon per advice type, reused everywhere they appear.

## 3. Color Palette

| Color | Hex | Usage |
|---|---|---|
| 🟦 Deep Sky (Primary) | `#1B4965` | Headers, primary buttons, key numbers (temperature). |
| 🔵 Sky Blue (Accent) | `#5FA8D3` | Secondary actions, links, active tab indicator. |
| 🟢 Safe Green | `#2E7D32` | Low risk, good conditions, "no umbrella needed". |
| 🟡 Caution Amber | `#F9A825` | Medium risk, moderate warnings (e.g. UV moderate-high). |
| 🔴 Alert Red | `#C62828` | High risk, severe-weather alerts (storm, extreme heat). |
| ⬜ Cloud Mist (Background) | `#EDF6FA` | Card backgrounds, section fills. |
| ⬛ Ink (Text) | `#1C1C1C` | Primary body text for maximum contrast/readability. |

## 4. Typography

- **Primary typeface:** a rounded, highly legible sans-serif (e.g. Inter or the platform system font) for all UI text.
- **Scale:** Display 32/40 (home temperature), Title 20/24 (section headers), Body 15/22 (advice text), Caption 12/16 (timestamps, secondary labels).
- Weight is used to establish hierarchy (semi-bold for headers, regular for body) rather than color alone, to keep the app accessible.

## 5. Iconography

| Category | Icon Style Notes |
|---|---|
| Weather conditions | Simple, filled weather glyphs (sun, cloud, rain, storm, snow) consistent across current, forecast, and map views. |
| Advice types | Distinct icons for clothing, umbrella, hydration, activity, travel, and plants — reused identically on the dashboard and detail screens. |
| Alerts | A single warning-triangle family, color-coded by severity (green/amber/red) rather than a different shape per alert type. |

## 6. Navigation Structure

- **Bottom tab bar:** Home | Forecast | Safety | Travel & Map | Profile.
- Home is the default landing tab and always shows the active/selected location's current weather and Smart Advice.
- Profile houses account settings, saved locations, plants, preferences, and weather history — kept out of the primary tabs to avoid clutter.

## 7. Core Screens

### 7.1 Home Dashboard
- Top: location selector + current condition icon, temperature, and one-line condition summary.
- Smart Advice card grid: What to Wear, Umbrella, Hydration, Activity — each a tappable card with icon + one-line advice.
- Alert banner (only shown when an alert is active) directly under the header, in the appropriate severity color.

### 7.2 Forecast
- Horizontally scrollable hourly strip (next 24h) above a vertically scrolling 7-day list.
- Rain probability shown as a small bar/percentage on each hour and day.

### 7.3 Safety Center
- List of alert cards, color-coded by severity, each expandable to show the explanation and recommended action.
- Empty state when no alerts are active: a calm, reassuring illustration + "No severe weather right now."

### 7.4 Travel & Map
- Destination search bar above a risk-result card (Low/Medium/High with contributing factors).
- Map view toggle showing rain/wind overlays, with the current and destination pins visible together.

### 7.5 Plant Care
- Grid of plant cards (photo/icon, name, watering status icon: water now / skip / water this evening).

### 7.6 AI Assistant
- Simple chat interface; assistant responses visually distinguished from the user's questions and always include a short reasoning line.

### 7.7 Profile & Settings
- Account details, saved locations manager, plant manager, notification preferences, and weather history, each as a clearly labeled list item.

## 8. Interaction States

| State | Treatment |
|---|---|
| Loading | Skeleton placeholders matching the shape of the real card (not a generic spinner) to reduce perceived wait time. |
| Empty | A short, friendly message plus one clear next action (e.g. "Add a location to get started"). |
| Error | Plain-language explanation ("We couldn't reach the weather service") with a retry button; never a raw error code. |
| Offline / stale data | A persistent but unobtrusive banner: "Showing last update from HH:MM" rather than blocking the whole screen. |

## 9. Accessibility

- Minimum contrast ratio of 4.5:1 for body text against its background, verified for each color pairing in Section 3.
- Never rely on color alone to convey severity — alert cards always include a text label ("High Risk") alongside the color.
- Touch targets sized at least 44x44dp; hourly forecast and plant cards remain tappable without precision taps.
- All icons paired with a text label or accessible description for screen readers.

## 10. Design Deliverables

- Figma file with the color/type/icon system as reusable styles and components.
- High-fidelity mockups for each of the seven core screens in Section 7, plus their loading/empty/error states.
- A shared component library (cards, buttons, tab bar, alert banner) so Frontend rotation days can assemble screens from existing pieces rather than rebuilding UI each time.