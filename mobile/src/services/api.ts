/**
 * services/api.ts
 * Base API configuration for WeatherWise AI.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getExpoLanAddress(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  try {
    const hostname = new URL(`http://${hostUri}`).hostname;
    const octets = hostname.split('.').map(Number);
    if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
      return null;
    }

    const [first, second] = octets;
    const isPrivateAddress = first === 10
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168)
      || (first === 169 && second === 254);

    return isPrivateAddress ? hostname : null;
  } catch {
    return null;
  }
}

const expoLanAddress = getExpoLanAddress();

export const API_BASE_URL = (() => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (Platform.OS === 'web') {
    return (configuredUrl || 'http://localhost:3000/api/v1').replace(/\/$/, '');
  }

  if (configuredUrl) {
    const normalizedUrl = configuredUrl.replace(/\/$/, '');
    if (expoLanAddress) {
      try {
        const url = new URL(normalizedUrl);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          url.hostname = expoLanAddress;
          return url.toString().replace(/\/$/, '');
        }
      } catch {
        return normalizedUrl;
      }
    }
    return normalizedUrl;
  }

  if (expoLanAddress) {
    return `http://${expoLanAddress}:3000/api/v1`;
  }

  // Fallback for Android emulators and iOS simulators when Expo has no LAN host.
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api/v1'
    : 'http://localhost:3000/api/v1';
})();

const REQUEST_TIMEOUT_MS = 10_000;

let authToken: string | null = null;

class ApiResponseError extends Error {}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

export async function apiFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = new Headers(init?.headers || {});
    headers.set('Content-Type', 'application/json');

    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...init,
      signal: controller.signal,
      headers,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiResponseError(payload?.error?.message || `API error: ${response.status} ${response.statusText}`);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The request timed out. Check your connection and try again.');
    }
    if (error instanceof ApiResponseError) throw error;

    throw new Error(
      `Cannot reach the WeatherWise API at ${API_BASE_URL}. Start the backend with "npm run backend" and connect your phone and computer to the same Wi-Fi. If you are using Expo tunnel mode, set EXPO_PUBLIC_API_URL to your computer's LAN address.`,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
