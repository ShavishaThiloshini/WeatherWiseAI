/**
 * services/locationService.ts
 * Placeholder service for device location.
 *
 * TODO (Day 2+): Implement real GPS using expo-location once location
 * permissions and the backend integration are ready.
 */

import type { LocationData } from '../types';

// ---------------------------------------------------------------------------
// Mock data (clearly marked - replace in Day 2+)
// ---------------------------------------------------------------------------

export const MOCK_LOCATION: LocationData = {
  latitude: 6.9271,
  longitude: 79.8612,
  city: 'Colombo',
  region: 'Western Province',
  country: 'Sri Lanka',
  displayName: 'Colombo, Sri Lanka',
};

// ---------------------------------------------------------------------------
// Service functions (placeholder implementations)
// ---------------------------------------------------------------------------

/**
 * Requests the user's current device location.
 * @returns Mock location data until expo-location is integrated (Day 2+)
 */
export async function getCurrentLocation(): Promise<LocationData> {
  // TODO (Day 2+): Replace with expo-location implementation:
  // const { status } = await Location.requestForegroundPermissionsAsync();
  // if (status !== 'granted') { throw new Error('Location permission denied'); }
  // const coords = await Location.getCurrentPositionAsync({});
  // const geocode = await Location.reverseGeocodeAsync(coords.coords);
  // ... map to LocationData
  return Promise.resolve(MOCK_LOCATION);
}
