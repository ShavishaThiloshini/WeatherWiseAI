/**
 * services/locationService.ts
 * Device location and saved-location service.
 */

import * as Location from 'expo-location';
import type { LocationData } from '../types';
import { apiFetch } from './api';

interface ReverseGeocodeResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

async function reverseGeocodeWithFallback(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      { headers: { Accept: 'application/json' } },
    );
    if (!response.ok) return null;
    return (await response.json()) as ReverseGeocodeResponse;
  } catch {
    return null;
  }
}

export const MOCK_LOCATION: LocationData = {
  latitude: 6.9271,
  longitude: 79.8612,
  city: 'Colombo',
  region: 'Western Province',
  country: 'Sri Lanka',
  displayName: 'Colombo, Sri Lanka',
};

export async function getCurrentLocation(): Promise<LocationData> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new Error('Location permission was denied. Enable it in your device settings to use local weather.');
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude, longitude } = position.coords;
  const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
  const fallback = address?.city ? null : await reverseGeocodeWithFallback(latitude, longitude);
  const fallbackAddress = fallback?.address;

  const city = address?.city
    || address?.district
    || address?.subregion
    || fallbackAddress?.city
    || fallbackAddress?.town
    || fallbackAddress?.village
    || fallbackAddress?.municipality
    || fallbackAddress?.county
    || 'Current location';
  const region = address?.region || fallbackAddress?.state || '';
  const country = address?.country || fallbackAddress?.country || '';

  return {
    latitude,
    longitude,
    city,
    region,
    country,
    displayName: [city, country].filter(Boolean).join(', '),
  };
}

export interface SavedLocation {
  id: number;
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
  is_default: boolean;
}

export async function listSavedLocations(): Promise<SavedLocation[]> {
  const response = await apiFetch<{ locations: SavedLocation[] }>('/locations');
  return response.locations;
}

export async function saveLocation(location: Omit<SavedLocation, 'id'>): Promise<SavedLocation> {
  const response = await apiFetch<{ location: SavedLocation }>('/locations', {
    method: 'POST',
    body: JSON.stringify({ ...location, is_default: location.is_default }),
  });
  return response.location;
}
