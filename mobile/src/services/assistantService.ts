import type { ForecastData, LocationData, WeatherData } from '../types';
import { apiFetch } from './api';

export interface WeatherAssistantResponse {
  answer: string;
  source: string;
  recommendations: Array<{
    category: string;
    title: string;
    message: string;
  }>;
}

export async function askWeatherQuestion(
  question: string,
  location: LocationData,
  weather: WeatherData,
  forecast: ForecastData | null,
): Promise<WeatherAssistantResponse> {
  return apiFetch<WeatherAssistantResponse>('/ai/assistant', {
    method: 'POST',
    body: JSON.stringify({
      question,
      weather: {
        location: {
          label: location.displayName,
          latitude: location.latitude,
          longitude: location.longitude,
        },
        current: {
          temperature_c: weather.temperatureC,
          feels_like_c: weather.feelsLikeC,
          humidity_percent: weather.humidity,
          wind_speed_kmh: weather.windSpeedKmh,
          wind_direction: weather.windDirection,
          uv_index: weather.uvIndex,
          rain_probability_percent: weather.rainProbability,
          visibility_km: weather.visibilityKm,
          condition: weather.conditionLabel,
          observed_at: weather.timestamp,
        },
        ...(forecast ? {
          forecast: {
            hours: forecast.hourly.slice(0, 24).map((hour) => ({
              time: hour.time,
              temperature_c: hour.temperatureC,
              rain_probability_percent: hour.rainProbability,
              condition: hour.condition,
            })),
            days: forecast.daily.map((day) => ({
              date: day.date,
              maxTempC: day.maxTempC,
              minTempC: day.minTempC,
              rainProbability: day.rainProbability,
            })),
          },
        } : {}),
      },
    }),
  });
}
