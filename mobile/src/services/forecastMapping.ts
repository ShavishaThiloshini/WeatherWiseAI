import type { ForecastData } from '../types';

export function toRecommendationForecast(forecast: ForecastData): Record<string, unknown> {
  return {
    hours: forecast.hourly.slice(0, 24).map((hour) => ({
      time: hour.time,
      temperature_c: hour.temperatureC,
      rain_probability_percent: hour.rainProbability,
      condition: hour.condition,
    })),
    days: forecast.daily.slice(0, 7).map((day) => ({
      date: day.date,
      max_temp_c: day.maxTempC,
      min_temp_c: day.minTempC,
      rain_probability_percent: day.rainProbability,
    })),
  };
}
