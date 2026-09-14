const DEFAULT_PROVIDER_URL = 'https://api.open-meteo.com/v1/forecast';

function weatherCondition(code) {
  if (code === 0) return { condition: 'sunny', conditionLabel: 'Clear Sky' };
  if ([1, 2].includes(code)) return { condition: 'partly-cloudy', conditionLabel: 'Partly Cloudy' };
  if (code === 3) return { condition: 'cloudy', conditionLabel: 'Overcast' };
  if ([45, 48].includes(code)) return { condition: 'foggy', conditionLabel: 'Foggy' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { condition: 'rainy', conditionLabel: 'Rainy' };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'snowy', conditionLabel: 'Snowy' };
  if ([95, 96, 99].includes(code)) return { condition: 'stormy', conditionLabel: 'Thunderstorm' };
  return { condition: 'unknown', conditionLabel: 'Unknown' };
}

function valueAt(values, index, fallback = null) {
  return Array.isArray(values) && values[index] !== undefined ? values[index] : fallback;
}

function createProviderError(message, code = 'WEATHER_UNAVAILABLE', status = 503) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

async function fetchOpenMeteo(latitude, longitude, fetchImpl = global.fetch) {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,uv_index',
    hourly: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation_probability,visibility,weather_code,uv_index',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,uv_index_max',
    forecast_days: '7',
    timezone: 'auto',
  });
  const url = `${process.env.WEATHER_PROVIDER_URL || DEFAULT_PROVIDER_URL}?${query}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.WEATHER_PROVIDER_TIMEOUT_MS) || 8000);

  try {
    let response;
    try {
      response = await fetchImpl(url, { signal: controller.signal });
    } catch (error) {
      throw createProviderError(error.name === 'AbortError' ? 'Weather provider timed out' : 'Weather provider request failed');
    }
    if (!response.ok) throw createProviderError(`Weather provider returned ${response.status}`);
    const payload = await response.json().catch(() => null);
    if (!payload || !payload.current || !payload.hourly || !payload.daily) {
      throw createProviderError('Weather provider returned incomplete data', 'WEATHER_INVALID_RESPONSE');
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeProviderPayload(payload) {
  const current = payload.current;
  const currentCondition = weatherCondition(current.weather_code);
  const currentHour = Math.max((payload.hourly.time || []).indexOf(current.time), 0);
  const hourly = (payload.hourly.time || []).map((time, index) => ({
    time,
    temperatureC: valueAt(payload.hourly.temperature_2m, index),
    temperature: valueAt(payload.hourly.temperature_2m, index),
    feelsLike: valueAt(payload.hourly.apparent_temperature, index),
    ...weatherCondition(valueAt(payload.hourly.weather_code, index)),
    humidity: valueAt(payload.hourly.relative_humidity_2m, index),
    windSpeed: valueAt(payload.hourly.wind_speed_10m, index),
    windDirection: valueAt(payload.hourly.wind_direction_10m, index),
    uvLevel: valueAt(payload.hourly.uv_index, index),
    rainProbability: valueAt(payload.hourly.precipitation_probability, index, 0),
    visibilityKm: valueAt(payload.hourly.visibility, index) === null
      ? null
      : valueAt(payload.hourly.visibility, index) / 1000,
  }));
  const daily = (payload.daily.time || []).map((date, index) => ({
    date,
    maxTempC: valueAt(payload.daily.temperature_2m_max, index),
    minTempC: valueAt(payload.daily.temperature_2m_min, index),
    ...weatherCondition(valueAt(payload.daily.weather_code, index)),
    rainProbability: valueAt(payload.daily.precipitation_probability_max, index, 0),
    uvIndex: valueAt(payload.daily.uv_index_max, index),
  }));

  return {
    current: {
      temperature_c: current.temperature_2m,
      feels_like_c: current.apparent_temperature,
      humidity_percent: current.relative_humidity_2m,
      wind_speed_kmh: current.wind_speed_10m,
      wind_direction_degrees: current.wind_direction_10m,
      uv_index: current.uv_index,
      rain_probability_percent: valueAt(payload.hourly.precipitation_probability, currentHour, 0),
      visibility_km: valueAt(payload.hourly.visibility, currentHour) === null
        ? null
        : valueAt(payload.hourly.visibility, currentHour) / 1000,
      ...currentCondition,
      observed_at: current.time,
    },
    hourly,
    daily,
    timezone: payload.timezone || 'UTC',
  };
}

module.exports = { fetchOpenMeteo, normalizeProviderPayload, weatherCondition };
