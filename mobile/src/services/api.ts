/**
 * services/api.ts
 * Base API configuration for WeatherWise AI.
 *
 * The base URL is resolved from the EXPO_PUBLIC_API_URL environment variable
 * (see mobile/.env.local) so the app can target a device-reachable backend
 * host instead of a hardcoded address. Falls back to the local dev backend.
 */

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3001/api/v1';
const REQUEST_TIMEOUT_MS = 10_000;

/** Resolves the API base URL, stripping any trailing slash. */
function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!configured) return DEFAULT_API_BASE_URL;
  return configured.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

let authToken: string | null = null;

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
      throw new Error(payload?.error?.message || `API error: ${response.status} ${response.statusText}`);
    }

    return payload as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
