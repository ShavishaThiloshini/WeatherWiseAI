/**
 * services/api.ts
 * Base API configuration for WeatherWise AI.
 */

const API_BASE_URL = 'http://127.0.0.1:3000/api/v1';
const REQUEST_TIMEOUT_MS = 10_000;

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
