/**
 * services/weatherService.ts
 * Placeholder service for weather data fetching.
 *
 * TODO (Day 2+): Replace mock data with real API calls using `apiFetch` once
 * the weather API integration is assigned.
 */

import type { WeatherData, ForecastData, Recommendation } from '../types';

// Temporary type for mock alert (will be replaced with proper type from types)
interface MockWeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'advisory' | 'watch' | 'warning' | 'emergency';
  issuedAt: string;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Mock data (clearly marked - replace in Day 2+)
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
  hourly: [],  // TODO: Populate with hourly mock data in Day 2+
  daily: [],   // TODO: Populate with daily mock data in Day 2+
};

// Mock recommendations for Smart Advice section
export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: '1',
    category: 'clothing',
    title: 'Clothing',
    description: 'Light and breathable clothing recommended. It will be warm and partly cloudy today.',
    severity: 'info',
    icon: '👕',
  },
  {
    id: '2',
    category: 'umbrella',
    title: 'Umbrella',
    description: 'Carry an umbrella — rain is possible later today around 4:00 PM.',
    severity: 'warning',
    icon: '☂️',
  },
  {
    id: '3',
    category: 'hydration',
    title: 'Hydration',
    description: 'Drink water regularly today. High humidity and temperature may increase fluid loss.',
    severity: 'success',
    icon: '💧',
  },
];

// Mock activity scores
export const MOCK_TRAVEL_SAFETY: Recommendation = {
  id: '4',
  category: 'travel',
  title: 'Travel Safety',
  description: 'Low risk. Weather conditions are generally suitable for travel.',
  severity: 'success',
  score: 85,
  icon: '🚗',
};

export const MOCK_OUTDOOR_ACTIVITY: Recommendation = {
  id: '5',
  category: 'outdoor',
  title: 'Outdoor Activity',
  description: 'Good conditions for outdoor activities. Avoid peak UV hours (10am–2pm).',
  severity: 'success',
  score: 78,
  icon: '🏃',
};

// Mock plant care recommendation
export const MOCK_PLANT_CARE: Recommendation = {
  id: '6',
  category: 'plant-care',
  title: 'Plant Care',
  description: 'Watering may not be necessary today because rain is expected.',
  severity: 'success',
  icon: '🌱',
};

// Mock weather alert
export const MOCK_WEATHER_ALERT: MockWeatherAlert | null = {
  id: '1',
  title: 'Heavy Rain Expected',
  description: 'Heavy rain expected later today. Travel carefully and avoid unnecessary outdoor activity.',
  severity: 'warning',
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
};

// Mock rain timing data
export const MOCK_RAIN_TIMING = {
  nextRainTime: '4:00 PM',
  rainIntensity: 'moderate',
  expectedDuration: '2-3 hours',
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
