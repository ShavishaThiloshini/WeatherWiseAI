/**
 * services/weatherService.ts
 * Weather data fetching and normalization for WeatherWise AI.
 *
 * Data sources:
 *  - Current weather  → Open-Meteo (free, no API key, direct from device)
 *  - Forecast         → WeatherWise backend proxy (/api/v1/weather/forecast)
 *  - Recommendations  → WeatherWise backend AI proxy (/api/v1/dashboard)
 *
 * Mock exports (MOCK_WEATHER, MOCK_FORECAST) are retained for screens that
 * are still transitioning to live data and for unit tests.
 */

import type { WeatherData, ForecastData, RecommendationResponse } from '../types';
import { apiFetch } from './api';
import { WEATHER_PROVIDER_URL } from '../constants/config';

// ---------------------------------------------------------------------------
// Mock data (clearly marked — used as fallback / for testing)
// ---------------------------------------------------------------------------

export const MOCK_WEATHER: WeatherData = {
  temperatureC: 28,
  feelsLikeC: 30,
  condition: 'partly-cloudy',
  conditionLabel: 'Partly Cloudy',
  humidity: 72,
  windSpeedKmh: 14,
  windDirection: 'SW',
  uvIndex: 7,
  rainProbability: 60,
  visibilityKm: 10,
  timestamp: new Date().toISOString(),
};

export const MOCK_FORECAST: ForecastData = {
  hourly: [],
  daily: [],
};

// ---------------------------------------------------------------------------
// Open-Meteo response shape (internal — not exported)
// ---------------------------------------------------------------------------

interface OpenMeteoCurrentResponse {
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    uv_index: number;
  };
  hourly?: {
    time: string[];
    precipitation_probability: number[];
    visibility: number[];
    temperature_2m: number[];
    weather_code: number[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function conditionForCode(code: number): Pick<WeatherData, 'condition' | 'conditionLabel'> {
  if (code === 0) return { condition: 'sunny', conditionLabel: 'Clear Sky' };
  if ([1, 2].includes(code)) return { condition: 'partly-cloudy', conditionLabel: 'Partly Cloudy' };
  if (code === 3) return { condition: 'cloudy', conditionLabel: 'Overcast' };
  if ([45, 48].includes(code)) return { condition: 'foggy', conditionLabel: 'Foggy' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { condition: 'rainy', conditionLabel: 'Rainy' };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'snowy', conditionLabel: 'Snowy' };
  if ([95, 96, 99].includes(code)) return { condition: 'stormy', conditionLabel: 'Thunderstorm' };
  return { condition: 'unknown', conditionLabel: 'Unknown' };
}

function compassDirection(degrees: number): string {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8];
}

// ---------------------------------------------------------------------------
// Current weather — fetched directly from Open-Meteo (no API key needed)
// ---------------------------------------------------------------------------

/** Fetches and normalizes the current weather for the given coordinates. */
export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,uv_index',
    hourly: 'precipitation_probability,visibility,temperature_2m,weather_code',
    forecast_days: '1',
    timezone: 'auto',
  });

  const response = await fetch(`${WEATHER_PROVIDER_URL}?${query.toString()}`);
  if (!response.ok) throw new Error(`Weather service returned ${response.status}.`);

  const data = (await response.json()) as OpenMeteoCurrentResponse;
  if (!data.current || !data.hourly) throw new Error('Weather service returned incomplete data.');

  const hourIndex = Math.max(data.hourly.time.indexOf(data.current.time), 0);
  return {
    temperatureC: Math.round(data.current.temperature_2m),
    feelsLikeC: Math.round(data.current.apparent_temperature),
    ...conditionForCode(data.current.weather_code),
    humidity: Math.round(data.current.relative_humidity_2m),
    windSpeedKmh: Math.round(data.current.wind_speed_10m),
    windDirection: compassDirection(data.current.wind_direction_10m),
    uvIndex: Math.round(data.current.uv_index),
    rainProbability: Math.round(data.hourly.precipitation_probability[hourIndex] ?? 0),
    visibilityKm: Math.round((data.hourly.visibility[hourIndex] ?? 0) / 1000),
    timestamp: data.current.time,
  };
}

// ---------------------------------------------------------------------------
// Forecast — proxied through the WeatherWise backend
// ---------------------------------------------------------------------------

/** Fetches hourly + 7-day forecast for the given coordinates via the backend. */
export async function getForecast(
  latitude: number,
  longitude: number,
): Promise<ForecastData> {
  try {
    return await apiFetch<ForecastData>(`/weather/forecast?lat=${latitude}&lon=${longitude}`);
  } catch {
    // Graceful fallback to Open-Meteo directly if the backend proxy is unavailable.
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      hourly: 'temperature_2m,precipitation_probability,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,uv_index_max',
      forecast_days: '7',
      timezone: 'auto',
    });
    const response = await fetch(`${WEATHER_PROVIDER_URL}?${query.toString()}`);
    if (!response.ok) return MOCK_FORECAST;

    const data = await response.json() as {
      hourly?: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weather_code: number[] };
      daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]; weather_code: number[]; uv_index_max: number[] };
    };

    const hourly = (data.hourly?.time ?? []).slice(0, 24).map((time, i) => ({
      time,
      temperatureC: Math.round(data.hourly!.temperature_2m[i] ?? 0),
      ...conditionForCode(data.hourly!.weather_code[i] ?? 0),
      rainProbability: data.hourly!.precipitation_probability[i] ?? 0,
    }));

    const daily = (data.daily?.time ?? []).map((date, i) => ({
      date,
      maxTempC: Math.round(data.daily!.temperature_2m_max[i] ?? 0),
      minTempC: Math.round(data.daily!.temperature_2m_min[i] ?? 0),
      ...conditionForCode(data.daily!.weather_code[i] ?? 0),
      rainProbability: data.daily!.precipitation_probability_max[i] ?? 0,
      uvIndex: Math.round(data.daily!.uv_index_max[i] ?? 0),
    }));

    return { hourly, daily };
  }
}

// ---------------------------------------------------------------------------
// Dashboard recommendations — proxied through the WeatherWise backend
// ---------------------------------------------------------------------------

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
