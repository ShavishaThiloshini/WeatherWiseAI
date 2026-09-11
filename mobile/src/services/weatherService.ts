/**
 * services/weatherService.ts
 * Weather data fetching and normalization.
 */

import type { WeatherData, ForecastData, RecommendationResponse } from '../types';
import { apiFetch } from './api';

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

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoResponse {
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
  };
}

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

  const data = (await response.json()) as OpenMeteoResponse;
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

/**
 * Fetches a 7-day forecast for the given coordinates.
 * @returns Forecast data until the forecast screen is connected to the provider.
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
