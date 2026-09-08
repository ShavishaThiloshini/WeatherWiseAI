/**
 * services/weatherService.ts
 * Placeholder service for weather data fetching.
 *
 * TODO (Day 2+): Replace mock data with real API calls using `apiFetch` once
 * the weather API integration is assigned.
 */

import type { WeatherData, ForecastData, HourlyForecast, DailyForecast } from '../types';

// ---------------------------------------------------------------------------
// Optional OpenWeather integration
// Provide your OpenWeather API key via environment variable:
// - Expo: EXPO_PUBLIC_OPENWEATHER_KEY
// - Node: process.env.OPENWEATHER_API_KEY
// Do NOT commit the key to source control.
const OPENWEATHER_KEY = (process.env.EXPO_PUBLIC_OPENWEATHER_KEY as string) || (process.env.OPENWEATHER_API_KEY as string) || (globalThis as any).__OPENWEATHER_API_KEY__;

function degToCompass(num: number) {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return arr[(val % 16)];
}

// ---------------------------------------------------------------------------
// Mock data (used as fallback when API key is not provided)
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
  hourly: [],
  daily: [],
};

// ---------------------------------------------------------------------------
// Helper to call OpenWeather One Call API and map to our types
// ---------------------------------------------------------------------------
async function fetchOpenWeatherOneCall(lat: number, lon: number) {
  if (!OPENWEATHER_KEY) throw new Error('OpenWeather API key not configured');

  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${OPENWEATHER_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`OpenWeather error ${resp.status}`);
  return resp.json();
}

export async function getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
  if (!OPENWEATHER_KEY) return Promise.resolve(MOCK_WEATHER);

  const data = await fetchOpenWeatherOneCall(latitude, longitude);

  const current = data.current;
  const hourly0 = (data.hourly && data.hourly[0]) || {};

  const weatherCondition = (current.weather && current.weather[0] && current.weather[0].main) || 'Unknown';

  // Map OpenWeather fields to our WeatherData
  const mapped: WeatherData = {
    temperatureC: Math.round(current.temp),
    feelsLikeC: Math.round(current.feels_like),
    condition: 'unknown',
    conditionLabel: (current.weather && current.weather[0] && current.weather[0].description) || weatherCondition,
    humidity: current.humidity,
    windSpeedKmh: Math.round((current.wind_speed || 0) * 3.6),
    windDirection: degToCompass(current.wind_deg || 0),
    uvIndex: Math.round(current.uvi || 0),
    rainProbability: Math.round((hourly0.pop || 0) * 100),
    visibilityKm: Math.round((current.visibility || 0) / 1000),
    timestamp: new Date((current.dt || Date.now()) * 1000).toISOString(),
  };

  return mapped;
}

export async function getForecast(latitude: number, longitude: number): Promise<ForecastData> {
  if (!OPENWEATHER_KEY) return Promise.resolve(MOCK_FORECAST);

  const data = await fetchOpenWeatherOneCall(latitude, longitude);

  const hourlyRaw = data.hourly || [];
  const dailyRaw = data.daily || [];

  const hourly: HourlyForecast[] = hourlyRaw.slice(0, 24).map((h: any) => ({
    time: new Date(h.dt * 1000).toISOString(),
    temperatureC: Math.round(h.temp),
    condition: 'unknown',
    rainProbability: Math.round((h.pop || 0) * 100),
  }));

  const daily: DailyForecast[] = dailyRaw.slice(0, 7).map((d: any) => ({
    date: new Date(d.dt * 1000).toISOString().slice(0,10),
    maxTempC: Math.round(d.temp.max),
    minTempC: Math.round(d.temp.min),
    condition: 'unknown',
    conditionLabel: (d.weather && d.weather[0] && d.weather[0].description) || '',
    rainProbability: Math.round((d.pop || 0) * 100),
    uvIndex: Math.round(d.uvi || 0),
  }));

  return { hourly, daily };
}

