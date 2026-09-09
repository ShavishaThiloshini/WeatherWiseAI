/**
 * hooks/useForecast.ts
 * Loads hourly + daily forecast for the given coordinates.
 */

import { getForecast } from "../services/weatherService";
import { useAsyncData } from "./useAsyncData";
import type { ForecastData } from "../types";

export function useForecast(latitude: number | null, longitude: number | null) {
  return useAsyncData<ForecastData>(() => {
    if (latitude === null || longitude === null) {
      return Promise.reject(new Error("Waiting for location"));
    }
    return getForecast(latitude, longitude);
  }, [latitude, longitude]);
}
