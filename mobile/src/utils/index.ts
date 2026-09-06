/**
 * utils/index.ts
 * Barrel export for utility functions.
 *
 * TODO (Day 2+): Add utility functions here as they are created, e.g.:
 *   export { formatTemperature } from './formatTemperature';
 *   export { getUVLabel } from './getUVLabel';
 *   export { formatWindDirection } from './formatWindDirection';
 */

/**
 * Converts a Celsius temperature to Fahrenheit.
 * Included as a starting utility example.
 */
export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Returns a human-readable label for a UV index value.
 */
export function getUVLabel(uvIndex: number): string {
  if (uvIndex <= 2) return 'Low';
  if (uvIndex <= 5) return 'Moderate';
  if (uvIndex <= 7) return 'High';
  if (uvIndex <= 10) return 'Very High';
  return 'Extreme';
}
