const DEFAULT_PROVIDER_URL = 'https://nominatim.openstreetmap.org';
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const mapCache = new Map();

function createMapError(message, code = 'MAP_PROVIDER_UNAVAILABLE', status = 503) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function normalizePlace(place) {
  if (!place || typeof place !== 'object') return null;

  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;

  const address = place.address || {};
  const city = address.city || address.town || address.village || address.municipality
    || address.county || place.name || '';
  return {
    id: String(place.place_id || `${latitude},${longitude}`),
    name: city || place.display_name || 'Unknown place',
    latitude,
    longitude,
    region: address.state || '',
    country: address.country || '',
    displayName: place.display_name || [city, address.country].filter(Boolean).join(', '),
  };
}

function getCache(key) {
  const cached = mapCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    mapCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCache(key, value) {
  const ttl = Number(process.env.MAP_CACHE_TTL_MS) || DEFAULT_CACHE_TTL_MS;
  mapCache.set(key, { value, expiresAt: Date.now() + ttl });
}

async function requestMapProvider(path, params, fetchImpl = global.fetch) {
  const baseUrl = (process.env.MAP_PROVIDER_URL || DEFAULT_PROVIDER_URL).replace(/\/$/, '');
  const query = new URLSearchParams({ ...params, format: 'jsonv2', addressdetails: '1' });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.MAP_PROVIDER_TIMEOUT_MS) || 5000);

  try {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}/${path}?${query}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en',
          'User-Agent': process.env.MAP_PROVIDER_USER_AGENT || 'WeatherWiseAI/1.0',
        },
      });
    } catch (error) {
      throw createMapError(error.name === 'AbortError' ? 'Map provider timed out' : 'Map provider request failed');
    }
    if (!response.ok) throw createMapError(`Map provider returned ${response.status}`);
    const payload = await response.json().catch(() => null);
    if (payload === null) throw createMapError('Map provider returned invalid data', 'MAP_INVALID_RESPONSE');
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchPlaces(query, fetchImpl = global.fetch) {
  const normalizedQuery = String(query || '').trim().replace(/\s+/g, ' ');
  const cacheKey = `search:${normalizedQuery.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const payload = await requestMapProvider('search', { q: normalizedQuery, limit: '5' }, fetchImpl);
  if (!Array.isArray(payload)) throw createMapError('Map provider returned invalid search results', 'MAP_INVALID_RESPONSE');
  const places = payload.map(normalizePlace).filter(Boolean);
  setCache(cacheKey, places);
  return places;
}

async function reverseGeocode(latitude, longitude, fetchImpl = global.fetch) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const cacheKey = `reverse:${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const payload = await requestMapProvider('reverse', {
    lat: String(lat),
    lon: String(lon),
    zoom: '10',
  }, fetchImpl);
  const place = normalizePlace(payload);
  if (!place) throw createMapError('Map provider returned invalid place data', 'MAP_INVALID_RESPONSE');
  setCache(cacheKey, place);
  return place;
}

function clearMapsCache() {
  mapCache.clear();
}

module.exports = { clearMapsCache, normalizePlace, reverseGeocode, searchPlaces };