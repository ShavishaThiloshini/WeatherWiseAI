const { fetchOpenMeteo, normalizeProviderPayload } = require('./weather-provider.service');

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

module.exports = {
  clearWeatherCache,
  getCurrentWeather,
  getForecastWeather,
  getHourlyForecast,
  weatherCache,
};
