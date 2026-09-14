/**
 * services/weatherService.ts
 * Weather data fetching and normalization.
 */

import type { WeatherData, ForecastData, RecommendationResponse } from '../types';
import { apiFetch } from './api';
import { normalizeCurrentWeather } from './weatherNormalization';
import type { OpenMeteoCurrentResponse } from './weatherNormalization';

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
  hourly: [],
  daily: [],
};

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';


const WEATHER_CONDITIONS: WeatherData['condition'][] = [
  'sunny', 'partly-cloudy', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy', 'unknown',
];

function conditionFromProvider(value: unknown): WeatherData['condition'] {
  return typeof value === 'string' && WEATHER_CONDITIONS.includes(value as WeatherData['condition'])
    ? value as WeatherData['condition']
    : 'unknown';
}

/** Fetches and normalizes the current weather for the given coordinates. */
export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,uv_index',
    hourly: 'precipitation_probability,visibility',
    forecast_days: '1',
    timezone: 'auto',
  });
  const response = await fetch(`${WEATHER_API_URL}?${query.toString()}`);
  if (!response.ok) throw new Error(`Weather service returned ${response.status}.`);

  const data = (await response.json()) as OpenMeteoCurrentResponse;
  return normalizeCurrentWeather(data);
}

/**
 * Fetches a 7-day forecast for the given coordinates.
 * @returns Forecast data until the forecast screen is connected to the provider.
 */
export async function getForecast(
  latitude: number,
  longitude: number,
): Promise<ForecastData> {
  const response = await apiFetch<{
    hourly?: Array<Record<string, unknown>>;
    daily?: Array<Record<string, unknown>>;
  }>(`/weather/forecast?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`);

  return {
    hourly: (response.hourly || []).map((hour) => ({
      time: String(hour.time || ''),
      temperatureC: Number(hour.temperatureC ?? 0),
      condition: conditionFromProvider(hour.condition),
      rainProbability: Number(hour.rainProbability ?? 0),
      feelsLikeC: hour.feelsLike == null ? undefined : Number(hour.feelsLike),
      humidity: hour.humidity == null ? undefined : Number(hour.humidity),
      uvIndex: hour.uvLevel == null ? undefined : Number(hour.uvLevel),
    })),
    daily: (response.daily || []).map((day) => ({
      date: String(day.date || ''),
      maxTempC: Number(day.maxTempC ?? 0),
      minTempC: Number(day.minTempC ?? 0),
      condition: conditionFromProvider(day.condition),
      conditionLabel: String(day.conditionLabel || 'Unknown'),
      rainProbability: Number(day.rainProbability ?? 0),
      uvIndex: Number(day.uvIndex ?? 0),
    })),
  };
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
