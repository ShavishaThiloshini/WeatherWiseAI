const { fetchOpenMeteo, normalizeProviderPayload } = require('./weather-provider.service');

const weatherCache = global.__weatherwiseWeatherCache || new Map();
global.__weatherwiseWeatherCache = weatherCache;
const CACHE_TTL_MS = Number(process.env.WEATHER_CACHE_TTL_MS) || 5 * 60 * 1000;

function validateCoordinates(latitude, longitude) {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
    const error = new Error('Latitude must be a number between -90 and 90');
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }
  if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
    const error = new Error('Longitude must be a number between -180 and 180');
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }
  return { latitude: parsedLatitude, longitude: parsedLongitude };
}

function cacheKey(latitude, longitude) {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

async function getWeather(latitude, longitude) {
  const coordinates = validateCoordinates(latitude, longitude);
  const key = cacheKey(coordinates.latitude, coordinates.longitude);
  const cached = weatherCache.get(key);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached.data, data_freshness: new Date(cached.fetchedAt).toISOString(), cached: true };
  }

  try {
    const data = normalizeProviderPayload(await fetchOpenMeteo(coordinates.latitude, coordinates.longitude));
    weatherCache.set(key, { data, fetchedAt: now });
    return { ...data, data_freshness: new Date(now).toISOString(), cached: false };
  } catch (error) {
    if (cached) {
      return {
        ...cached.data,
        data_freshness: new Date(cached.fetchedAt).toISOString(),
        cached: true,
        stale: true,
      };
    }
    throw error;
  }
}

async function getCurrentWeather(latitude, longitude) {
  const weather = await getWeather(latitude, longitude);
  return {
    location: { latitude: Number(latitude), longitude: Number(longitude), timezone: weather.timezone },
    current: weather.current,
    data_freshness: weather.data_freshness,
    cached: weather.cached,
    ...(weather.stale ? { stale: true } : {}),
  };
}

async function getForecast(latitude, longitude) {
  const weather = await getWeather(latitude, longitude);
  return {
    location: { latitude: Number(latitude), longitude: Number(longitude), timezone: weather.timezone },
    hourly: weather.hourly,
    daily: weather.daily,
    data_freshness: weather.data_freshness,
    cached: weather.cached,
    ...(weather.stale ? { stale: true } : {}),
  };
}

async function getHourlyForecast(latitude, longitude) {
  const weather = await getWeather(latitude, longitude);
  
  // Format the response specifically for the hourly forecast endpoint
  const hourlyForecast = weather.hourly.map(hour => ({
    time: hour.time,
    temperature: hour.temperature,
    feelsLike: hour.feelsLike,
    condition: hour.condition,
    humidity: hour.humidity,
    windSpeed: hour.windSpeed,
    windDirection: hour.windDirection,
    uvLevel: hour.uvLevel,
    rainProbability: hour.rainProbability
  }));

  return {
    location: { 
      latitude: Number(latitude), 
      longitude: Number(longitude) 
    },
    hourlyForecast
  };
}

function clearWeatherCache() {
  weatherCache.clear();
}

module.exports = { getCurrentWeather, getForecast, getHourlyForecast, clearWeatherCache, validateCoordinates };
