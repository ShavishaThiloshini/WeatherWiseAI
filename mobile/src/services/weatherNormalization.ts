export type NormalizedCondition =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'snowy'
  | 'foggy'
  | 'windy'
  | 'unknown';

export interface OpenMeteoCurrentResponse {
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    uv_index: number;
  };
  hourly?: {
    time: string[];
    precipitation_probability: number[];
    visibility: number[];
  };
}

export interface NormalizedCurrentWeather {
  temperatureC: number;
  feelsLikeC: number;
  condition: NormalizedCondition;
  conditionLabel: string;
  humidity: number;
  windSpeedKmh: number;
  windDirection: string;
  uvIndex: number;
  rainProbability: number;
  visibilityKm: number;
  timestamp: string;
}

function roundedFinite(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

function nonNegativeRounded(value: unknown): number {
  return Math.max(0, roundedFinite(value));
}

function boundedPercent(value: unknown): number {
  return Math.min(100, Math.max(0, roundedFinite(value)));
}

function conditionForCode(code: number): Pick<NormalizedCurrentWeather, 'condition' | 'conditionLabel'> {
  if (code === 0) return { condition: 'sunny', conditionLabel: 'Clear Sky' };
  if ([1, 2].includes(code)) return { condition: 'partly-cloudy', conditionLabel: 'Partly Cloudy' };
  if (code === 3) return { condition: 'cloudy', conditionLabel: 'Overcast' };
  if ([45, 48].includes(code)) return { condition: 'foggy', conditionLabel: 'Foggy' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: 'rainy', conditionLabel: 'Rainy' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'snowy', conditionLabel: 'Snowy' };
  if ([95, 96, 99].includes(code)) return { condition: 'stormy', conditionLabel: 'Thunderstorm' };
  return { condition: 'unknown', conditionLabel: 'Unknown' };
}

function compassDirection(degrees: number): string {
  const normalized = Number.isFinite(degrees) ? ((degrees % 360) + 360) % 360 : 0;
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(normalized / 45) % 8];
}

export function normalizeCurrentWeather(data: OpenMeteoCurrentResponse): NormalizedCurrentWeather {
  if (!data.current || !data.hourly) throw new Error('Weather service returned incomplete data.');

  const hourIndex = Math.max(data.hourly.time.indexOf(data.current.time), 0);
  return {
    temperatureC: roundedFinite(data.current.temperature_2m),
    feelsLikeC: roundedFinite(data.current.apparent_temperature),
    ...conditionForCode(data.current.weather_code),
    humidity: boundedPercent(data.current.relative_humidity_2m),
    windSpeedKmh: nonNegativeRounded(data.current.wind_speed_10m),
    windDirection: compassDirection(data.current.wind_direction_10m),
    uvIndex: nonNegativeRounded(data.current.uv_index),
    rainProbability: boundedPercent(data.hourly.precipitation_probability?.[hourIndex]),
    visibilityKm: roundedFinite((data.hourly.visibility?.[hourIndex] ?? 0) / 1000),
    timestamp: data.current.time || new Date(0).toISOString(),
  };
}