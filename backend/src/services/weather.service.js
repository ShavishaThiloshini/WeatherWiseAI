const { fetchOpenMeteo, normalizeProviderPayload } = require('./weather-provider.service');
const { assessDestinationWeather } = require('./travel-risk.service');

const weatherCache = new Map();

function cacheKey(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return `${Number.isFinite(lat) ? lat.toFixed(4) : 'invalid'},${Number.isFinite(lon) ? lon.toFixed(4) : 'invalid'}`;
}

function clearWeatherCache() {
  weatherCache.clear();
}

async function loadNormalizedWeather(latitude, longitude, options = {}) {
  const key = cacheKey(latitude, longitude);
  const shouldUseCache = options.useCache !== false;

  if (shouldUseCache && weatherCache.has(key)) {
    const cached = weatherCache.get(key);
    return { ...cached, cached: true };
  }

  const payload = await fetchOpenMeteo(latitude, longitude);
  const normalized = normalizeProviderPayload(payload);
  weatherCache.set(key, normalized);

  return { ...normalized, cached: false };
}

async function getCurrentWeather(latitude, longitude) {
  const normalized = await loadNormalizedWeather(latitude, longitude);
  return {
    current: normalized.current,
    timezone: normalized.timezone,
    cached: normalized.cached,
  };
}

async function getForecastWeather(latitude, longitude) {
  const normalized = await loadNormalizedWeather(latitude, longitude);
  return {
    hourly: normalized.hourly,
    daily: normalized.daily,
    timezone: normalized.timezone,
    cached: normalized.cached,
  };
}

async function getHourlyForecast(latitude, longitude) {
  const normalized = await loadNormalizedWeather(latitude, longitude);
  return {
    hourlyForecast: normalized.hourly,
    timezone: normalized.timezone,
  };
}

async function getDestinationWeather(latitude, longitude, name = 'Destination') {
  const normalized = await loadNormalizedWeather(latitude, longitude);
  const label = String(name || '').trim().slice(0, 120) || 'Destination';

  return {
    success: true,
    destination: {
      latitude: Number(latitude),
      longitude: Number(longitude),
      name: label,
    },
    weather: {
      temperature: normalized.current.temperature_c,
      feelsLike: normalized.current.feels_like_c,
      condition: normalized.current.conditionLabel,
      humidity: normalized.current.humidity_percent,
      windSpeed: normalized.current.wind_speed_kmh,
      windDirection: normalized.current.wind_direction_degrees,
      uvIndex: normalized.current.uv_index,
      rainProbability: normalized.current.rain_probability_percent,
      precipitation: normalized.current.precipitation_mm,
      visibility: normalized.current.visibility_km
    },
    forecast: normalized.daily.map(day => ({
      date: day.date,
      maxTemp: day.maxTempC,
      minTemp: day.minTempC,
      condition: day.conditionLabel,
      rainProbability: day.rainProbability,
      uvIndex: day.uvIndex
    })),
    riskAssessment: assessDestinationWeather(normalized.current, { destinationLabel: label }),
    timezone: normalized.timezone,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  clearWeatherCache,
  getCurrentWeather,
  getForecastWeather,
  getHourlyForecast,
  getDestinationWeather,
  weatherCache,
};
