const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');
const { clearWeatherCache } = require('../src/services/weather.service');

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
    uv_index: 8, // Very High
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
    name: 'Heat User',
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

test('heat endpoint returns valid categorizations', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3012;
  
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    // Return High Temp / Very High UV
    return new Response(JSON.stringify(providerPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const server = await startServer(port);

  try {
    const token = await register(`heat-${Date.now()}@test.com`, port);
    const result = await request('GET', '/api/v1/weather/heat?lat=6.9271&lon=79.8612', undefined, token, port);

    assert.equal(result.status, 200);
    assert.equal(result.payload.location.latitude, 6.9271);
    assert.equal(result.payload.current.temperature_c, 31.5);
    assert.equal(result.payload.current.feels_like_c, 34.2);
    assert.equal(result.payload.current.uv_index, 8);
    
    // Math.max(31.5, 34.2) = 34.2 => Hot (<37)
    assert.equal(result.payload.analysis.heat_category, 'Hot');
    
    // UV 8 => Very High
    assert.equal(result.payload.analysis.uv_category, 'Very High');
    assert.equal(result.payload.analysis.hydration_indicator, 'Hydration Recommended');
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('heat endpoint categorizes Normal and Low UV correctly', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3013;
  
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    const payload = JSON.parse(JSON.stringify(providerPayload));
    payload.current.temperature_2m = 22;
    payload.current.apparent_temperature = 22;
    payload.current.uv_index = 2; // Low
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const server = await startServer(port);

  try {
    const token = await register(`heat2-${Date.now()}@test.com`, port);
    const result = await request('GET', '/api/v1/weather/heat?lat=6.9271&lon=79.8612', undefined, token, port);

    assert.equal(result.status, 200);
    assert.equal(result.payload.analysis.heat_category, 'Normal');
    assert.equal(result.payload.analysis.uv_category, 'Low');
    assert.equal(result.payload.analysis.hydration_indicator, 'Standard Hydration');
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('heat endpoint categorizes Extreme heat and Extreme UV correctly', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3014;
  
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    const payload = JSON.parse(JSON.stringify(providerPayload));
    payload.current.temperature_2m = 42;
    payload.current.apparent_temperature = 45;
    payload.current.uv_index = 11; // Extreme
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const server = await startServer(port);

  try {
    const token = await register(`heat3-${Date.now()}@test.com`, port);
    const result = await request('GET', '/api/v1/weather/heat?lat=6.9271&lon=79.8612', undefined, token, port);

    assert.equal(result.status, 200);
    assert.equal(result.payload.analysis.heat_category, 'Extreme Heat');
    assert.equal(result.payload.analysis.uv_category, 'Extreme');
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('heat endpoint handles missing UV and temperature gracefully', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3015;
  
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    const payload = JSON.parse(JSON.stringify(providerPayload));
    payload.current.temperature_2m = null;
    payload.current.apparent_temperature = null;
    payload.current.uv_index = null;
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const server = await startServer(port);

  try {
    const token = await register(`heat4-${Date.now()}@test.com`, port);
    const result = await request('GET', '/api/v1/weather/heat?lat=6.9271&lon=79.8612', undefined, token, port);

    assert.equal(result.status, 200);
    assert.equal(result.payload.current.temperature_c, null);
    assert.equal(result.payload.current.uv_index, null);
    assert.equal(result.payload.analysis.heat_category, null);
    assert.equal(result.payload.analysis.uv_category, null);
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('heat endpoint validates coordinates', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const port = 3016;
  const server = await startServer(port);
  try {
    const token = await register(`invalid-heat-${Date.now()}@test.com`, port);
    const result = await request('GET', '/api/v1/weather/heat?lat=91&lon=79', undefined, token, port);
    assert.equal(result.status, 400);
    assert.equal(result.payload.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('heat endpoint handles provider failures gracefully', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3017;
  
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    return new Response('upstream failure', { status: 503 });
  };
  
  const server = await startServer(port);

  try {
    const token = await register(`heat-fail-${Date.now()}@test.com`, port);
    const result = await request('GET', '/api/v1/weather/heat?lat=6.9271&lon=79.8612', undefined, token, port);

    assert.equal(result.status, 503);
    assert.equal(result.payload.error.code, 'WEATHER_UNAVAILABLE');
    // Ensure no API keys or raw internal errors are leaked
    assert.equal(result.payload.error.message.includes('upstream'), false);
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});
