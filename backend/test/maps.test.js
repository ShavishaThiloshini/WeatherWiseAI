const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');
const { clearMapsCache } = require('../src/services/maps-provider.service');
const { clearWeatherCache } = require('../src/services/weather.service');

const weatherPayload = {
  timezone: 'Asia/Colombo',
  current: {
    time: '2026-09-13T08:00',
    temperature_2m: 31.5,
    apparent_temperature: 34.2,
    relative_humidity_2m: 72,
    wind_speed_10m: 18,
    wind_direction_10m: 135,
    weather_code: 2,
    uv_index: 8,
    precipitation: 0,
  },
  hourly: {
    time: ['2026-09-13T08:00'],
    temperature_2m: [31.5],
    apparent_temperature: [34.2],
    relative_humidity_2m: [72],
    wind_speed_10m: [18],
    wind_direction_10m: [135],
    precipitation_probability: [75],
    precipitation: [0],
    visibility: [8000],
    weather_code: [2],
    uv_index: [8],
  },
  daily: {
    time: ['2026-09-13'],
    temperature_2m_max: [33],
    temperature_2m_min: [25],
    precipitation_probability_max: [80],
    weather_code: [61],
    uv_index_max: [9],
  },
};

async function request(method, path, body, token, port) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, payload: await response.json() };
}

async function startServer(port) {
  const server = app.listen(port);
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
}

async function register(port) {
  const result = await request('POST', '/api/v1/auth/register', {
    name: 'Map User',
    email: `maps-${Date.now()}@test.com`,
    password: 'secret123',
  }, undefined, port);
  return result.payload.token;
}

test('maps endpoints require authentication and validate input', async () => {
  resetMemoryStore();
  const port = 3020;
  const server = await startServer(port);
  try {
    const unauthorized = await request('GET', '/api/v1/maps/search?q=Colombo', undefined, undefined, port);
    assert.equal(unauthorized.status, 401);

    const token = await register(port);
    const invalidQuery = await request('GET', '/api/v1/maps/search?q=x', undefined, token, port);
    const invalidCoordinates = await request('GET', '/api/v1/maps/weather?lat=91&lon=79', undefined, token, port);
    assert.equal(invalidQuery.status, 400);
    assert.equal(invalidQuery.payload.error.code, 'VALIDATION_ERROR');
    assert.equal(invalidCoordinates.status, 400);
    assert.equal(invalidCoordinates.payload.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('map search and reverse geocoding proxy normalized, cached places', async () => {
  resetMemoryStore();
  clearMapsCache();
  const originalFetch = global.fetch;
  const port = 3021;
  let searchCalls = 0;
  let reverseCalls = 0;
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    const providerUrl = new URL(String(url));
    assert.equal(options.headers['User-Agent'], 'WeatherWiseAI/1.0');
    if (providerUrl.pathname.endsWith('/search')) {
      searchCalls += 1;
      return new Response(JSON.stringify([{
        place_id: 123,
        lat: '6.9271',
        lon: '79.8612',
        name: 'Colombo',
        display_name: 'Colombo, Sri Lanka',
        address: { city: 'Colombo', state: 'Western Province', country: 'Sri Lanka' },
      }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    reverseCalls += 1;
    return new Response(JSON.stringify({
      place_id: 123,
      lat: '6.9271',
      lon: '79.8612',
      display_name: 'Colombo, Sri Lanka',
      address: { city: 'Colombo', state: 'Western Province', country: 'Sri Lanka' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const server = await startServer(port);

  try {
    const token = await register(port);
    const search = await request('GET', '/api/v1/maps/search?q=Colombo', undefined, token, port);
    const cachedSearch = await request('GET', '/api/v1/maps/search?q=colombo', undefined, token, port);
    const reverse = await request('GET', '/api/v1/maps/reverse?lat=6.9271&lon=79.8612', undefined, token, port);

    assert.equal(search.status, 200);
    assert.deepEqual(search.payload.places[0], {
      id: '123',
      name: 'Colombo',
      latitude: 6.9271,
      longitude: 79.8612,
      region: 'Western Province',
      country: 'Sri Lanka',
      displayName: 'Colombo, Sri Lanka',
    });
    assert.deepEqual(cachedSearch.payload, search.payload);
    assert.equal(reverse.payload.place.name, 'Colombo');
    assert.equal(reverse.payload.place.latitude, 6.9271);
    assert.equal(searchCalls, 1);
    assert.equal(reverseCalls, 1);
  } finally {
    global.fetch = originalFetch;
    clearMapsCache();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('map weather combines its center with normalized cached provider weather', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3022;
  let providerCalls = 0;
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    providerCalls += 1;
    return new Response(JSON.stringify(weatherPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const server = await startServer(port);

  try {
    const token = await register(port);
    const result = await request('GET', '/api/v1/maps/weather?lat=6.9271&lon=79.8612', undefined, token, port);
    const cachedResult = await request('GET', '/api/v1/maps/weather?lat=6.9271&lon=79.8612', undefined, token, port);
    assert.equal(result.status, 200);
    assert.deepEqual(result.payload.center, { latitude: 6.9271, longitude: 79.8612 });
    assert.equal(result.payload.current.temperature_c, 31.5);
    assert.equal(result.payload.hourlyForecast[0].rainProbability, 75);
    assert.equal(result.payload.timezone, 'Asia/Colombo');
    assert.equal(result.payload.cached, false);
    assert.equal(cachedResult.payload.cached, true);
    assert.equal(providerCalls, 1);
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});