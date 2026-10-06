const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');
const { clearWeatherCache } = require('../src/services/weather.service');

const providerPayload = {
  timezone: 'Asia/Colombo',
  current: {
    time: '2026-10-06T19:00',
    temperature_2m: 29,
    apparent_temperature: 33,
    relative_humidity_2m: 72,
    wind_speed_10m: 14,
    wind_direction_10m: 225,
    weather_code: 2,
    uv_index: 7,
    precipitation: 0,
  },
  hourly: {
    time: ['2026-10-06T19:00'],
    temperature_2m: [29],
    apparent_temperature: [33],
    relative_humidity_2m: [72],
    wind_speed_10m: [14],
    wind_direction_10m: [225],
    weather_code: [2],
    uv_index: [7],
    precipitation_probability: [40],
    precipitation: [0],
    visibility: [10000],
  },
  daily: {
    time: ['2026-10-06'],
    temperature_2m_max: [31],
    temperature_2m_min: [25],
    precipitation_probability_max: [60],
    weather_code: [2],
    uv_index_max: [8],
  },
};

async function startServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
}

async function request(server, method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, payload: response.status === 204 ? null : await response.json() };
}

test('authenticated user, saved location, weather provider, and AI recommendation form one data flow', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  let recommendationRequest;

  global.fetch = async (input, options) => {
    const url = new URL(String(input));
    if (url.pathname.startsWith('/api/v1/')) return originalFetch(input, options);
    if (url.pathname === '/recommend') {
      recommendationRequest = JSON.parse(options.body);
      return new Response(JSON.stringify({
        request_id: 'integration-test',
        source: 'deterministic_rules',
        recommendations: [],
        assistant_context: { summary: 'Conditions are available for this saved location.' },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(providerPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const server = await startServer();
  try {
    const registration = await request(server, 'POST', '/api/v1/auth/register', {
      name: 'Integration User',
      email: `integration-${Date.now()}-${Math.random()}@test.com`,
      password: 'secret123',
    });
    assert.equal(registration.status, 201);
    const token = registration.payload.token;

    const createdLocation = await request(server, 'POST', '/api/v1/locations', {
      label: 'Colombo',
      latitude: 6.9271,
      longitude: 79.8612,
      timezone: 'Asia/Colombo',
    }, token);
    assert.equal(createdLocation.status, 201);
    assert.equal(createdLocation.payload.location.isDefault, true);

    const savedLocations = await request(server, 'GET', '/api/v1/locations', undefined, token);
    assert.equal(savedLocations.status, 200);
    assert.equal(savedLocations.payload.locations.length, 1);

    const preferenceUpdate = await request(server, 'PATCH', '/api/v1/users/preferences', {
      units: 'imperial',
      preferredActivity: 'Cycling',
    }, token);
    assert.equal(preferenceUpdate.status, 200);
    assert.equal(preferenceUpdate.payload.preferences.units, 'imperial');

    const currentWeather = await request(
      server,
      'GET',
      '/api/v1/weather/current?lat=6.9271&lon=79.8612',
      undefined,
      token,
    );
    assert.equal(currentWeather.status, 200);
    assert.equal(currentWeather.payload.current.temperature_c, 29);
    assert.equal(currentWeather.payload.current.rain_probability_percent, 40);
    assert.equal(currentWeather.payload.timezone, 'Asia/Colombo');

    const dashboard = await request(server, 'POST', '/api/v1/dashboard', {
      location: {
        label: savedLocations.payload.locations[0].label,
        latitude: savedLocations.payload.locations[0].latitude,
        longitude: savedLocations.payload.locations[0].longitude,
        timezone: savedLocations.payload.locations[0].timezone,
      },
      current: currentWeather.payload.current,
    }, token);
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.payload.request_id, 'integration-test');
    assert.equal(recommendationRequest.location.label, 'Colombo');
    assert.equal(recommendationRequest.current.temperature_c, 29);
    assert.equal(recommendationRequest.current.rain_probability_percent, 40);
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});
