/**
 * hooks/useWeather.ts
 * Loads current weather for the given coordinates.
 */

import { getCurrentWeather } from "../services/weatherService";
import { useAsyncData } from "./useAsyncData";
import type { WeatherData } from "../types";

export function useWeather(latitude: number | null, longitude: number | null) {
  return useAsyncData<WeatherData>(() => {
    if (latitude === null || longitude === null) {
      return Promise.reject(new Error("Waiting for location"));
    }
    return getCurrentWeather(latitude, longitude);
  }, [latitude, longitude]);
}
