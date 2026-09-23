const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');
const { clearWeatherCache } = require('../src/services/weather.service');

const providerPayload = {
  timezone: 'Asia/Colombo',
  current: {
    time: '2026-09-13T08:00',
    temperature_2m: 27,
    apparent_temperature: 30,
    relative_humidity_2m: 85,
    wind_speed_10m: 18,
    wind_direction_10m: 135,
    weather_code: 63, // Moderate Rain
    uv_index: 3,
    precipitation: 4.5,
  },
  hourly: {
    time: ['2026-09-13T07:00', '2026-09-13T08:00', '2026-09-13T09:00', '2026-09-13T10:00'],
    temperature_2m: [26, 27, 28, 28],
    apparent_temperature: [29, 30, 31, 31],
    relative_humidity_2m: [85, 85, 80, 80],
    wind_speed_10m: [15, 18, 15, 12],
    wind_direction_10m: [120, 135, 135, 135],
    precipitation_probability: [0, 80, 90, 0],
    precipitation: [0, 4.5, 10.2, 0],
    visibility: [10000, 8000, 5000, 10000],
    weather_code: [2, 63, 65, 3],
    uv_index: [1, 3, 4, 4]
  },
  daily: {
    time: ['2026-09-13'],
    temperature_2m_max: [30],
    temperature_2m_min: [25],
    precipitation_probability_max: [90],
    weather_code: [65],
    uv_index_max: [5],
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
    name: 'Rain User',
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

test('rain alert endpoint returns categorized rain data', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3025;
  
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    return new Response(JSON.stringify(providerPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const server = await startServer(port);

  try {
    const token = await register(`rain-${Date.now()}@test.com`, port);
    const result = await request('GET', '/api/v1/weather/rain-alert?lat=6.9271&lon=79.8612', undefined, token, port);

    assert.equal(result.status, 200);
    assert.equal(result.payload.location.latitude, 6.9271);
    assert.equal(result.payload.weather.temperature, 27);
    assert.equal(result.payload.weather.windSpeed, 18);
    assert.equal(result.payload.weather.thunderstorm, false);
    
    // Check rain categorization
    assert.equal(result.payload.rain.probability, 80); // From the current hour
    assert.equal(result.payload.rain.precipitation, 4.5);
    assert.equal(result.payload.rain.intensity, 'Moderate'); // <= 7.6
    assert.equal(result.payload.rain.condition, 'Rainy'); 
    
    // Check rain timing (next hour with rain > 0)
    assert.equal(result.payload.rain.nextRainTime, '2026-09-13T09:00');
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});
