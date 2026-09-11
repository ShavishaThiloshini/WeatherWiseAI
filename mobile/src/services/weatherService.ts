/**
 * services/weatherService.ts
 * Placeholder service for weather data fetching.
 *
 * TODO (Day 2+): Replace mock data with real API calls using `apiFetch` once
 * the weather API integration is assigned.
 */

import type { WeatherData, ForecastData, RecommendationResponse } from '../types';
import { apiFetch } from './api';

// ---------------------------------------------------------------------------
// Mock data (clearly marked - replace in Day 2+)
// ---------------------------------------------------------------------------

export const MOCK_WEATHER: WeatherData = {
  temperatureC: 29,
  feelsLikeC: 33,
  condition: 'partly-cloudy',
  conditionLabel: 'Partly Cloudy',
  humidity: 72,
  windSpeedKmh: 14,
  windDirection: 'SW',
  uvIndex: 7,
  rainProbability: 40,
  visibilityKm: 10,
  timestamp: new Date().toISOString(),
};

export const MOCK_FORECAST: ForecastData = {
  hourly: [],  // TODO: Populate with hourly mock data in Day 2+
  daily: [],   // TODO: Populate with daily mock data in Day 2+
};

// ---------------------------------------------------------------------------
// Service functions (placeholder implementations)
// ---------------------------------------------------------------------------

/**
 * Fetches current weather for the given coordinates.
 * @returns Mock data until the backend is connected (Day 2+)
 */
export async function getCurrentWeather(
  _latitude: number,
  _longitude: number,
): Promise<WeatherData> {
  // TODO (Day 2+): Replace with: return apiFetch<WeatherData>(`/weather/current?lat=${_latitude}&lon=${_longitude}`);
  return Promise.resolve(MOCK_WEATHER);
}

/**
 * Fetches a 7-day forecast for the given coordinates.
 * @returns Mock data until the backend is connected (Day 2+)
 */
export async function getForecast(
  _latitude: number,
  _longitude: number,
): Promise<ForecastData> {
  // TODO (Day 2+): Replace with: return apiFetch<ForecastData>(`/weather/forecast?lat=${_latitude}&lon=${_longitude}`);
  return Promise.resolve(MOCK_FORECAST);
}

export async function getRecommendations(
  locationId: string | number,
  current: Record<string, unknown>,
  forecast?: Record<string, unknown>,
): Promise<RecommendationResponse> {
  return apiFetch<RecommendationResponse>('/dashboard', {
    method: 'POST',
    body: JSON.stringify({ location_id: locationId, current, forecast }),
  });
}

export async function getDashboardRecommendations(
  location: { id?: string | number; label: string; latitude: number; longitude: number; timezone?: string },
  current: Record<string, unknown>,
  forecast?: Record<string, unknown>,
): Promise<RecommendationResponse> {
  return apiFetch<RecommendationResponse>('/dashboard', {
    method: 'POST',
    body: JSON.stringify({ location, current, forecast }),
  });
}
