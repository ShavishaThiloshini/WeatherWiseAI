/**
 * services/api.ts
 * Base API configuration for WeatherWise AI.
 *
 * TODO (Day 2+): Configure the base URL, authentication headers, and
 * request/response interceptors once the backend team provides the API spec.
 */

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

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

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantRequestContext {
  location?: string;
  currentWeather?: {
    temperatureC?: number;
    feelsLikeC?: number;
    humidity?: number;
    windSpeedKmh?: number;
    uvIndex?: number;
    rainProbability?: number;
    conditionLabel?: string;
  };
  forecastSummary?: string;
  activeAlerts?: string[];
  preferences?: Record<string, unknown>;
  conversationHistory?: AssistantMessage[];
}

export interface AssistantResponse {
  provider: string;
  model: string;
  answer: string;
  reasoning: string;
  safety: string;
  suggestedAction: string;
  isFallback: boolean;
}

export async function askAssistant(
  message: string,
  context: AssistantRequestContext = {},
): Promise<AssistantResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/assistant/ask`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as AssistantResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}
