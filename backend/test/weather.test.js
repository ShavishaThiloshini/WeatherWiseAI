const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');
const { clearWeatherCache } = require('../src/services/weather.service');
const { normalizeProviderPayload } = require('../src/services/weather-provider.service');

const providerPayload = {
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
  },
  hourly: {
    time: ['2026-09-13T07:00', '2026-09-13T08:00'],
    temperature_2m: [30, 31.5],
    apparent_temperature: [32.1, 34.2],
    relative_humidity_2m: [80, 72],
    wind_speed_10m: [15, 18],
    wind_direction_10m: [120, 135],
    precipitation_probability: [20, 75],
    visibility: [10000, 8000],
    weather_code: [1, 2],
    uv_index: [2, 8]
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

const request = async (method, path, body, token, port) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, payload: await response.json() };
};

async function register(email, port) {
  const result = await request('POST', '/api/v1/auth/register', {
    name: 'Weather User',
    email,
    password: 'secret123',
  }, undefined, port);
  return result.payload.token;
}

async function startServer(port) {
  const server = app.listen(port);
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
}

test('provider payload is normalized into current, hourly, and daily weather data', () => {
  const normalized = normalizeProviderPayload(providerPayload);

  assert.deepEqual(normalized.current, {
    temperature_c: 31.5,
    feels_like_c: 34.2,
    humidity_percent: 72,
    wind_speed_kmh: 18,
    wind_direction_degrees: 135,
    uv_index: 8,
    rain_probability_percent: 75,
    visibility_km: 8,
    condition: 'partly-cloudy',
    conditionLabel: 'Partly Cloudy',
    observed_at: '2026-09-13T08:00',
  });
  assert.equal(normalized.hourly[1].rainProbability, 75);
  assert.equal(normalized.daily[0].maxTempC, 33);
  assert.equal(normalized.daily[0].condition, 'rainy');
});

test('weather endpoints fetch and cache normalized provider data', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3010;
  let providerCalls = 0;
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    providerCalls += 1;
    return new Response(JSON.stringify(providerPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const server = await startServer(port);

  try {
    const token = await register(`weather-${Date.now()}@test.com`, port);
    const current = await request('GET', '/api/v1/weather/current?lat=6.9271&lon=79.8612', undefined, token, port);
    const forecast = await request('GET', '/api/v1/weather/forecast?lat=6.9271&lon=79.8612', undefined, token, port);
    const hourly = await request('GET', '/api/v1/weather/hourly?lat=6.9271&lon=79.8612', undefined, token, port);

    assert.equal(current.status, 200);
    assert.equal(current.payload.current.temperature_c, 31.5);
    assert.equal(current.payload.current.rain_probability_percent, 75);
    
    assert.equal(forecast.status, 200);
    assert.equal(forecast.payload.hourly[1].temperatureC, 31.5);
    assert.equal(forecast.payload.daily[0].uvIndex, 9);
    
    assert.equal(hourly.status, 200);
    assert.equal(hourly.payload.hourlyForecast[1].temperature, 31.5);
    assert.equal(hourly.payload.hourlyForecast[1].feelsLike, 34.2);
    assert.equal(hourly.payload.hourlyForecast[1].humidity, 72);
    assert.equal(hourly.payload.hourlyForecast[1].uvLevel, 8);
    
    assert.equal(providerCalls, 1);
    assert.equal(forecast.payload.cached, true);
    assert.equal(hourly.payload.cached, undefined); // Our getHourlyForecast mapped it directly, doesn't pass cached boolean by default, wait, I didn't include data_freshness and cached in getHourlyForecast, which is fine since the req didn't ask for it.
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('weather endpoint validates coordinates before contacting provider', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const port = 3011;
  const server = await startServer(port);
  try {
    const token = await register(`invalid-weather-${Date.now()}@test.com`, port);
    const result = await request('GET', '/api/v1/weather/current?lat=91&lon=79', undefined, token, port);
    assert.equal(result.status, 400);
    assert.equal(result.payload.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
