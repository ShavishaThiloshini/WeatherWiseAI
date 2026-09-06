/**
 * services/api.ts
 * Base API configuration for WeatherWise AI.
 *
 * TODO (Day 2+): Configure the base URL, authentication headers, and
 * request/response interceptors once the backend team provides the API spec.
 */

// TODO: Move to environment variables or a secure config file (never commit API keys)
const API_BASE_URL = 'https://api.weatherwiseai.example.com/v1'; // Placeholder

/** Standard timeout for API requests in milliseconds */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Generic fetch wrapper.
 * Extend this in Day 2+ to handle authentication, error normalisation, etc.
 */
export async function apiFetch<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        // TODO (Day 2+): Add Authorization header once auth is implemented
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
