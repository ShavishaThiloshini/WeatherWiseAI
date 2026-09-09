/**
 * hooks/useRecommendations.ts
 * Loads AI recommendations from the backend for the given weather snapshot.
 */

import { getRecommendations } from "../services/weatherService";
import { useAsyncData } from "./useAsyncData";
import type { Recommendation, WeatherData } from "../types";

export function useRecommendations(weather: WeatherData | null) {
  return useAsyncData<Recommendation[]>(() => {
    if (!weather) return Promise.reject(new Error("Waiting for weather"));
    return getRecommendations({
      temperature: weather.temperatureC,
      feels_like: weather.feelsLikeC,
      humidity: weather.humidity,
      uv_index: weather.uvIndex,
      rain_probability: weather.rainProbability,
      wind_speed: weather.windSpeedKmh,
      condition: weather.condition,
    }).then((res) => res.recommendations);
  }, [
    weather?.temperatureC,
    weather?.humidity,
    weather?.uvIndex,
    weather?.rainProbability,
    weather?.windSpeedKmh,
  ]);
}
