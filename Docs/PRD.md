# WeatherWise AI
### Project Requirement Document (PRD)
*What are we building, and why?*

| Field | Detail |
|---|---|
| Project | WeatherWise AI (Smart Weather Assistant) |
| Document | 01 of 6 - Project Requirement Document |
| Team | Shavi, Rahavi, Danu, Ruvethika |
| Version | 1.0 |
| Status | Draft for team review |

## 1. Project Overview

WeatherWise AI is a mobile application that converts live weather and forecast data into personalized, actionable recommendations for clothing, hydration, travel, outdoor activities, plant care, and severe-weather safety. Instead of only reporting raw values such as temperature or humidity, the application interprets those values and tells the user what to do about them.

> *"Not just today's temperature — what the weather means for you today."*

This document defines what the WeatherWise AI application must do and why, so that the Technical Requirement Document, App Flow Document, UI/UX Design Brief, Backend Schema Document, and Implementation Plan can be built on a shared, agreed foundation.

## 2. Problem Statement

Standard weather apps display data but leave interpretation to the user. Users must manually decide whether current conditions call for an umbrella, sunscreen, warmer clothing, or a change of travel plans, and severe-weather alerts are often generic rather than tailored to the user's situation. WeatherWise AI addresses this by embedding a recommendation layer between the raw weather feed and the user.

## 3. Objectives

- Provide accurate current and forecast weather information based on the user's location.
- Automatically convert weather conditions into simple, actionable advice.
- Warn users about heavy rain, extreme heat, strong wind, thunderstorms, and other dangerous conditions.
- Help users make better decisions about travel, clothing, outdoor activities, hydration, and plant watering.
- Provide personalized recommendations based on the user's preferences, routine, and selected locations.
- Use AI/rule-based intelligence to transform raw weather data into meaningful, explainable recommendations.

## 4. Target Users

- Students and daily commuters.
- People who travel frequently.
- Outdoor activity users — walkers, runners, and cyclists.
- Home gardeners and plant owners.
- General users who need simple weather-based safety guidance.

## 5. Scope

### 5.1 In Scope

- Location detection and management of multiple saved locations.
- Current weather, hourly/multi-day forecast, and rain prediction.
- Smart Advice engine: clothing, umbrella, hydration, and outdoor activity recommendations.
- Severe-weather detection and explainable safety alerts.
- Travel safety scoring between current and destination locations.
- Plant-care watering recommendations.
- Interactive weather map.
- Notifications for severe weather and personalized alerts.
- Weather history with daily/weekly trends.
- Personalized dashboard and an AI Weather Assistant for natural-language questions.

### 5.2 Out of Scope (this iteration)

- Support for platforms other than the mobile app (no public web dashboard).
- Monetization, in-app purchases, or advertising.
- Multi-language localization (English only for the 30-day build).
- Social/sharing features between users.

## 6. Functional Requirements

The functional requirements below are grouped by the six feature areas introduced in the Proposal and expanded here in full, following the project's Software Requirements Specification (SRS).

| ID | Requirement | Description |
|---|---|---|
| FR-01 | Location Permission | Request location permission and use the user's current location once granted. |
| FR-02 | Automatic Home Weather | Show the current location's weather automatically on the home page. |
| FR-03 | Current Weather | Display temperature, feels-like temperature, humidity, wind speed/direction, pressure, visibility, UV index, sunrise and sunset. |
| FR-04 | Forecast | Provide hourly and multi-day weather forecasts. |
| FR-05 | Rain Prediction | Show rain probability, expected timing, and intensity where data is available. |
| FR-06 | Weather-Based Advice | Generate recommendations for clothing, umbrella use, hydration, travel, and outdoor activities. |
| FR-07 | Heat Warning | Detect high temperature/UV conditions and display hydration, sunscreen, shade, and heat-safety warnings. |
| FR-08 | Heavy Rain Warning | Warn users about heavy rainfall and advise avoiding unnecessary travel where appropriate. |
| FR-09 | Thunderstorm Warning | Provide alerts for thunderstorms and recommend avoiding exposed/open areas. |
| FR-10 | Strong Wind Warning | Warn users when wind conditions may make travel or outdoor activities unsafe. |
| FR-11 | Cold Weather Warning | Provide suitable clothing and cold-weather guidance during unusually cold conditions. |
| FR-12 | Travel Safety | Calculate a weather-related travel risk/safety score and explain the major risk factors. |
| FR-13 | Outdoor Activity Score | Score walking, running, cycling and similar activities using current and forecast conditions. |
| FR-14 | Plant Care | Recommend whether plants need watering using forecast rain, temperature, and user-selected plant information. |
| FR-15 | Weather Map | Provide an interactive map for weather/rain/wind information where supported. |
| FR-16 | Multiple Locations | Allow users to save places such as Home, University, Workplace, and Travel Destination. |
| FR-17 | Destination Weather | Compare current weather with destination weather before a trip. |
| FR-18 | Notifications | Send timely severe-weather and personalized weather alerts. |
| FR-19 | Weather History | Store and display daily/weekly weather summaries and trends. |
| FR-20 | Personalized Dashboard | Adapt recommendations using the user's preferences, routines, and selected activities. |

## 7. Smart Recommendation Engine — Condition-to-Advice Mapping

This is the core intelligence of the application. The engine does not generate advice randomly; it applies weather data, rule-based logic, and user profile information to produce consistent, explainable recommendations.

| Weather Condition | Automatic Recommendation |
|---|---|
| High temperature / strong sun | Drink plenty of water; avoid prolonged direct sunlight; use sunscreen; carry water; reduce intense outdoor activity. |
| Heavy rain | Carry an umbrella/raincoat; avoid unnecessary travel; show rain timing; warn about possible travel risk. |
| Thunderstorm | Avoid open areas and unnecessary outdoor activity; display a severe-weather alert. |
| Strong wind | Use caution when travelling; avoid risky outdoor activities. |
| Very cool / cold | Wear suitable warm clothing and provide cold-weather guidance. |
| High UV | Recommend sunscreen, shade, and protective clothing. |
| Hot + dry conditions | Suggest hydration and, where applicable, watering plants. |
| Rain expected | Reduce or skip plant watering depending on forecast and plant profile. |

## 8. User Stories

- As a commuter, I want to see today's weather and advice the moment I open the app, so that I know how to dress and whether to carry an umbrella without checking multiple sources.
- As a runner, I want an outdoor activity score and a suggested best time, so that I can plan my run around safer conditions.
- As a frequent traveller, I want to compare my current location's weather with my destination's, so that I can judge the risk of my trip before I leave.
- As a plant owner, I want to be told whether to water my plants today, so that I don't over-water before rain or under-water during a dry spell.
- As a user in severe weather, I want an alert that explains why it was triggered, so that I understand the actual risk rather than ignoring a generic warning.
- As a returning user, I want the app to remember my saved locations and preferences, so that my dashboard reflects my routine without repeated setup.
- As a curious user, I want to ask the AI Weather Assistant a direct question like "Can I go for a run at 5 PM?", so that I get a specific, weather-aware answer.

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Home weather information loads quickly; recent data is cached where appropriate. |
| Usability | Warnings and recommendations must be understandable at a glance. |
| Security | Protect user accounts, preferences, and location-related data. |
| Privacy | Request location permission clearly; allow users to disable location access. |
| Reliability | Handle API failures, unavailable forecasts, and missing location data gracefully. |
| Scalability | Backend must support additional users, locations, and weather providers. |
| Maintainability | Use modular frontend, backend, and AI/recommendation components. |
| Accessibility | Use readable text, clear icons, and sufficient contrast. |

## 10. Acceptance Criteria

- Given location permission is granted, the home screen displays current weather for that location within a short, cached-when-possible load time.
- Given current conditions meet a defined threshold (heat, rain, wind, storm, cold, UV), the app surfaces the corresponding Smart Advice and, where severe, a safety alert with an explanation.
- Given a user enters a travel destination, the app returns a risk level (low/medium/high) and lists the contributing risk factors.
- Given a user has added a plant profile, the app returns a watering recommendation that reflects the latest forecast.
- Given the weather API or location service is unavailable, the app degrades gracefully with a clear message rather than crashing or showing blank data.
- Given a user asks the AI Weather Assistant a question, the app returns an answer grounded in current/forecast data rather than a generic response.

## 11. Success Criteria

- All 20 functional requirements (FR-01 to FR-20) are implemented and demonstrable by Day 30.
- The Smart Advice engine produces correct, explainable recommendations for each of the eight condition categories in Section 7.
- The application passes functional, API, security, UI, and performance testing planned for Day 30.
- Every team member has worked across Frontend, Backend, AI, and Testing at least once through the rotation model.

## 12. Assumptions & Constraints

- A free-tier or student-accessible weather API will be used and may impose request-rate limits.
- The 30-day timeline assumes four active contributors following the rotation schedule without major absences.
- The MVP targets Android/iOS via React Native; no native-only features are assumed unless later required.

## 13. Document Change Log

| Version | Date | Change |
|---|---|---|
| 1.0 | Initial draft | Created from team discussion and the WeatherWise AI SRS. |