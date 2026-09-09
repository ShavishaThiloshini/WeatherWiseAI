/**
 * services/weatherService.ts
 * Weather data fetching from the WeatherWise backend API (real data).
 */

import { apiFetch } from './api';
import type { WeatherData, ForecastData, Recommendation } from '../types';

export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  const payload = await apiFetch<{ weather: WeatherData }>(
    `/weather/current?lat=${latitude}&lon=${longitude}`,
  );
  return payload.weather;
}

export async function getForecast(
  latitude: number,
  longitude: number,
): Promise<ForecastData> {
  const payload = await apiFetch<{ forecast: ForecastData }>(
    `/weather/forecast?lat=${latitude}&lon=${longitude}`,
  );
  return payload.forecast;
}

/**
 * Asks the backend for AI recommendations.
 * Sends the compact payload understood by the Python recommendation engine.
 */
export interface RecommendationResponse {
  recommendations: Recommendation[];
}

export async function getRecommendations(params: {
  temperature: number;
  uv_index?: number;
  rain_probability?: number;
  wind_speed?: number;
  condition?: string;
  humidity?: number;
  feels_like?: number;
}): Promise<RecommendationResponse> {
  return apiFetch<RecommendationResponse>('/recommendations', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
