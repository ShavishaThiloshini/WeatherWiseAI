/**
 * services/api.ts
 * Base API configuration for WeatherWise AI.
 *
 * The base URL resolves first from EXPO_PUBLIC_API_URL so the app can target
 * a device-reachable backend host during local testing. It then falls back to
 * the central config file for default staging / production values.
 */

import { API_BASE_URL as DEFAULT_API_BASE_URL, REQUEST_TIMEOUT_MS } from '../constants/config';

/** Resolves the API base URL, stripping any trailing slash. */
function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!configured) return DEFAULT_API_BASE_URL;
  return configured.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

let authToken: string | null = null;
/** Called when the server responds with TOKEN_EXPIRED — triggers app-level logout. */
let onTokenExpired: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

/**
 * Register a callback that is invoked when the backend returns TOKEN_EXPIRED.
 * App.tsx uses this to trigger logout and redirect to the AuthScreen.
 */
export function setOnTokenExpired(handler: (() => void) | null) {
  onTokenExpired = handler;
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
      // Handle token expiry at the transport layer so every screen benefits automatically.
      if (response.status === 401 && payload?.error?.code === 'TOKEN_EXPIRED') {
        clearAuthToken();
        onTokenExpired?.();
      }
      throw new Error(payload?.error?.message || `API error: ${response.status} ${response.statusText}`);
    }

    return payload as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
