import { apiFetch } from './api';

export interface AssistantWeatherContext {
  location: {
    label: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  current: {
    temperature_c: number;
    feels_like_c: number;
    humidity_percent: number;
    wind_speed_kmh: number;
    uv_index: number;
    rain_probability_percent: number;
    condition: string;
  };
}

export interface AssistantAnswer {
  answer: string;
  source: string;
  recommendations?: Array<{
    id: string;
    title: string;
    message: string;
    severity?: string;
  }>;
}

export async function askWeatherAssistant(
  question: string,
  weather: AssistantWeatherContext,
): Promise<AssistantAnswer> {
  return apiFetch<AssistantAnswer>('/ai/assistant', {
    method: 'POST',
    body: JSON.stringify({ question, weather }),
  });
}
