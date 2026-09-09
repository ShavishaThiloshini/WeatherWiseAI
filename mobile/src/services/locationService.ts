/**
 * services/locationService.ts
 * Real device location via expo-location, with reverse geocoding.
 */

import * as ExpoLocation from 'expo-location';
import type { LocationData } from '../types';

export async function getCurrentLocation(): Promise<LocationData> {
  const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission was denied. Enable it in Settings to see local weather.');
  }

  const position = await ExpoLocation.getCurrentPositionAsync({
    accuracy: ExpoLocation.Accuracy.Balanced,
  });
  const { latitude, longitude } = position.coords;

  const geocoded = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
  const place = geocoded[0];

  const city = place?.city || place?.district || place?.region || 'Unknown';
  const region = place?.region || '';
  const country = place?.country || '';

  return {
    latitude,
    longitude,
    city,
    region,
    country,
    displayName: [city, country].filter(Boolean).join(', '),
  };
}
