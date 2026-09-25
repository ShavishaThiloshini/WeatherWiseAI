import type { ForecastData, WeatherData } from '../types';

export const COLD_WARNING_THRESHOLD = 5;
export const FREEZING_THRESHOLD = 0;

export interface ColdWeatherSummary {
  lowestTemperature: number;
  isFreezing: boolean;
  source: 'current' | 'forecast';
}

export function getColdWeatherSummary(
  weather: WeatherData | null,
  forecast: ForecastData | null,
): ColdWeatherSummary | null {
  const currentTemperature = weather ? Math.min(weather.temperatureC, weather.feelsLikeC) : null;
  const forecastTemperature = forecast?.daily.length
    ? Math.min(...forecast.daily.slice(0, 3).map((day) => day.minTempC))
    : null;
  const candidates = [currentTemperature, forecastTemperature].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );

  if (!candidates.length) return null;

  const lowestTemperature = Math.min(...candidates);
  if (lowestTemperature > COLD_WARNING_THRESHOLD) return null;

  return {
    lowestTemperature,
    isFreezing: lowestTemperature <= FREEZING_THRESHOLD,
    source: forecastTemperature !== null && forecastTemperature <= lowestTemperature ? 'forecast' : 'current',
  };
}