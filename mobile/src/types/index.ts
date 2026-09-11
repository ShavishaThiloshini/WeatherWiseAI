/**
 * types/index.ts
 * Shared TypeScript interfaces and types for WeatherWise AI.
 * These types prepare the structure for future API integration.
 * Extend or refine these types as the backend API contracts are established (Days 2+).
 */

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  /** Human-readable display label, e.g. "Colombo, Sri Lanka" */
  displayName: string;
}

// ---------------------------------------------------------------------------
// Current Weather
// ---------------------------------------------------------------------------

export type WeatherCondition =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'snowy'
  | 'foggy'
  | 'windy'
  | 'unknown';

export interface WeatherData {
  /** Temperature in degrees Celsius */
  temperatureC: number;
  /** "Feels like" temperature in degrees Celsius */
  feelsLikeC: number;
  condition: WeatherCondition;
  /** Descriptive label, e.g. "Partly Cloudy" */
  conditionLabel: string;
  /** Humidity percentage (0-100) */
  humidity: number;
  /** Wind speed in km/h */
  windSpeedKmh: number;
  /** Wind direction, e.g. "NE" */
  windDirection: string;
  /** UV index (0-11+) */
  uvIndex: number;
  /** Probability of rain as a percentage (0-100) */
  rainProbability: number;
  /** Visibility in kilometres */
  visibilityKm: number;
  /** Data timestamp (ISO 8601) */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Forecast
// ---------------------------------------------------------------------------

export interface HourlyForecast {
  /** ISO 8601 datetime string */
  time: string;
  temperatureC: number;
  condition: WeatherCondition;
  rainProbability: number;
}

export interface DailyForecast {
  /** ISO 8601 date string */
  date: string;
  maxTempC: number;
  minTempC: number;
  condition: WeatherCondition;
  conditionLabel: string;
  rainProbability: number;
  uvIndex: number;
}

export interface ForecastData {
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

// ---------------------------------------------------------------------------
// Recommendations (Smart Advice)
// ---------------------------------------------------------------------------

export type RecommendationCategory =
  | 'clothing'
  | 'umbrella'
  | 'hydration'
  | 'travel'
  | 'outdoor'
  | 'plant-care'
  | 'general';

export type RecommendationSeverity = 'info' | 'warning' | 'danger' | 'success';

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  severity: RecommendationSeverity;
  /** Optional numeric score 0-100, e.g. Travel Safety Score */
  score?: number;
  /** Optional icon name (to be used with an icon library in future days) */
  icon?: string;
}

export interface RecommendationResponse {
  source: string;
  request_id: string | null;
  generated_at: string;
  location: {
    id: string | number | null;
    label: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
  };
  recommendations: Array<{
    id: string;
    category: RecommendationCategory;
    title: string;
    message: string;
    reason: string;
    priority: string;
    risk_level: string;
    severity: RecommendationSeverity;
    factors: Array<Record<string, unknown>>;
  }>;
  alerts: Array<Record<string, unknown>>;
  analysis: Record<string, unknown>;
  assistant_context: {
    summary: string;
    limitations: string[];
    location_label: string | null;
    timezone: string | null;
  };
}

// ---------------------------------------------------------------------------
// Weather Alerts
// ---------------------------------------------------------------------------

export type AlertSeverity = 'advisory' | 'watch' | 'warning' | 'emergency';

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  /** ISO 8601 datetime when alert was issued */
  issuedAt: string;
  /** ISO 8601 datetime when alert expires */
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// API Response wrappers (for service layer)
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}
