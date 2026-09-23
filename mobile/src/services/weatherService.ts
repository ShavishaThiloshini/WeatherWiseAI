/**
 * services/weatherService.ts
 * Weather data fetching and normalization.
 */

import type { WeatherData, ForecastData, RecommendationResponse, HeatData } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './api';
export { toRecommendationForecast } from './forecastMapping';
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
const CACHE_PREFIX = 'weatherwise.weather.v1';

function cacheKey(kind: 'current' | 'forecast', latitude: number, longitude: number): string {
  return `${CACHE_PREFIX}.${kind}.${latitude.toFixed(4)}.${longitude.toFixed(4)}`;
}

async function readCached<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

async function writeCached<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cache failure must never prevent live weather from rendering.
  }
}


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
  try {
    const response = await fetch(`${WEATHER_API_URL}?${query.toString()}`);
    if (!response.ok) throw new Error(`Weather service returned ${response.status}.`);
    const data = (await response.json()) as OpenMeteoCurrentResponse;
    const weather = normalizeCurrentWeather(data);
    await writeCached(cacheKey('current', latitude, longitude), weather);
    return weather;
  } catch (error) {
    const cached = await readCached<WeatherData>(cacheKey('current', latitude, longitude));
    if (cached) return cached;
    throw error;
  }
}

/**
 * Fetches a 7-day forecast for the given coordinates.
 * @returns Forecast data until the forecast screen is connected to the provider.
 */
export async function getForecast(
  latitude: number,
  longitude: number,
): Promise<ForecastData> {
  try {
    const response = await apiFetch<{
      hourly?: Array<Record<string, unknown>>;
      daily?: Array<Record<string, unknown>>;
    }>(`/weather/forecast?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`);

    const forecast = {
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
    await writeCached(cacheKey('forecast', latitude, longitude), forecast);
    return forecast;
  } catch (error) {
    const cached = await readCached<ForecastData>(cacheKey('forecast', latitude, longitude));
    if (cached) return cached;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Open-Meteo weather code helpers (shared with getForecastDirect)
// ---------------------------------------------------------------------------

/** Normalizes an Open-Meteo WMO weather interpretation code to a WeatherCondition. */
function conditionFromCode(code: number): { condition: WeatherData['condition']; conditionLabel: string } {
  if (code === 0) return { condition: 'sunny', conditionLabel: 'Clear Sky' };
  if (code === 1 || code === 2) return { condition: 'partly-cloudy', conditionLabel: 'Partly Cloudy' };
  if (code === 3) return { condition: 'cloudy', conditionLabel: 'Overcast' };
  if (code === 45 || code === 48) return { condition: 'foggy', conditionLabel: 'Foggy' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { condition: 'rainy', conditionLabel: 'Rainy' };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { condition: 'snowy', conditionLabel: 'Snowy' };
  if ([95, 96, 99].includes(code))
    return { condition: 'stormy', conditionLabel: 'Thunderstorm' };
  return { condition: 'unknown', conditionLabel: 'Unknown' };
}

/**
 * Direct Open-Meteo 7-day forecast fetch.
 *
 * Used as a fallback when the backend /weather/forecast endpoint is
 * unavailable (e.g. backend not running, network error, or auth failure).
 * The response is normalized to the same ForecastData shape as getForecast().
 *
 * NOTE: This bypasses the backend cache. In production the backend-mediated
 * path (getForecast) should always be preferred.
 */
export async function getForecastDirect(
  latitude: number,
  longitude: number,
): Promise<ForecastData> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,weather_code,uv_index',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,uv_index_max',
    forecast_days: '7',
    timezone: 'auto',
  });

  const response = await fetch(`${WEATHER_API_URL}?${query.toString()}`);
  if (!response.ok) throw new Error(`Weather provider returned ${response.status}.`);

  const data = (await response.json()) as {
    hourly?: {
      time: string[];
      temperature_2m: number[];
      apparent_temperature: number[];
      precipitation_probability: number[];
      weather_code: number[];
      uv_index: number[];
    };
    daily?: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: number[];
      weather_code: number[];
      uv_index_max: number[];
    };
  };

  const hourly: ForecastData['hourly'] = (data.hourly?.time ?? []).map((time, i) => {
    const code = data.hourly?.weather_code[i] ?? 0;
    return {
      time,
      temperatureC: Math.round(data.hourly?.temperature_2m[i] ?? 0),
      condition: conditionFromCode(code).condition,
      rainProbability: Math.min(100, Math.max(0, data.hourly?.precipitation_probability[i] ?? 0)),
      feelsLikeC: data.hourly?.apparent_temperature[i] != null
        ? Math.round(data.hourly.apparent_temperature[i])
        : undefined,
      uvIndex: data.hourly?.uv_index[i] != null
        ? Math.round(data.hourly.uv_index[i])
        : undefined,
    };
  });

  const daily: ForecastData['daily'] = (data.daily?.time ?? []).map((date, i) => {
    const code = data.daily?.weather_code[i] ?? 0;
    const { condition, conditionLabel } = conditionFromCode(code);
    return {
      date,
      maxTempC: Math.round(data.daily?.temperature_2m_max[i] ?? 0),
      minTempC: Math.round(data.daily?.temperature_2m_min[i] ?? 0),
      condition,
      conditionLabel,
      rainProbability: Math.min(100, Math.max(0, data.daily?.precipitation_probability_max[i] ?? 0)),
      uvIndex: Math.round(data.daily?.uv_index_max[i] ?? 0),
    };
  });

  return { hourly, daily };
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

/**
 * Fetches Heat Warning data for the Safety Center.
 * Uses a mock fallback if the backend is unavailable.
 */
export async function getHeatWarningData(
  latitude: number,
  longitude: number,
): Promise<HeatData> {
  try {
    const response = await apiFetch<HeatData>(
      `/weather/heat?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
    );
    return response;
  } catch (error) {
    // Return a mock fallback if backend is not ready
    return {
      location: { latitude, longitude },
      current: {
        temperature_c: MOCK_WEATHER.temperatureC,
        feels_like_c: MOCK_WEATHER.feelsLikeC,
        uv_index: MOCK_WEATHER.uvIndex,
        humidity_percent: MOCK_WEATHER.humidity,
        condition: MOCK_WEATHER.condition,
        conditionLabel: MOCK_WEATHER.conditionLabel,
        observed_at: MOCK_WEATHER.timestamp,
      },
      analysis: {
        heat_category: 'Hot',
        heat_risk: 'HIGH',
        heat_warning: true,
        heat_alert: false,
        uv_category: 'High',
        hydration_indicator: 'Hydration Recommended',
      },
      alerts: [
        {
          id: 'mock-heat-alert',
          title: 'High Heat Warning',
          description: 'Temperatures are very high. Stay hydrated and avoid prolonged sun exposure.',
          severity: 'warning',
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        }
      ],
      timezone: 'UTC',
    };
  }
}
