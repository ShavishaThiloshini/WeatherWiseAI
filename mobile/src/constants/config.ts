/**
 * constants/config.ts
 * Central configuration for WeatherWise AI.
 *
 * Day 29 — Production / Deployment:
 * Update API_BASE_URL to the staging or production backend URL before building
 * the Expo production bundle (e.g. eas build). Do NOT hardcode the production
 * URL inside individual service files.
 *
 * For local development the backend runs on 127.0.0.1:3000.
 * For physical device testing on the same LAN, replace 127.0.0.1 with your
 * machine's local IP address (e.g. 192.168.1.x:3000).
 */

/** Base URL of the WeatherWise AI backend API (no trailing slash). */
export const API_BASE_URL = 'http://127.0.0.1:3000/api/v1';

/** Open-Meteo free weather provider — no API key required. */
export const WEATHER_PROVIDER_URL = 'https://api.open-meteo.com/v1/forecast';

/** Request timeout for all backend API calls (ms). */
export const REQUEST_TIMEOUT_MS = 10_000;
