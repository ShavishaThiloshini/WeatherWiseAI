const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');
const { clearWeatherCache } = require('../src/services/weather.service');
const { buildActivityRecommendations } = require('../src/services/activity.service');

const providerPayload = {
  timezone: 'Asia/Colombo',
  current: {
    time: '2026-09-13T08:00',
    temperature_2m: 22,
    apparent_temperature: 22,
    relative_humidity_2m: 55,
    wind_speed_10m: 8,
    wind_direction_10m: 135,
    weather_code: 1,
    uv_index: 3,
  },
  hourly: {
    time: ['2026-09-13T07:00', '2026-09-13T08:00'],
    temperature_2m: [21, 22],
    apparent_temperature: [21, 22],
    relative_humidity_2m: [60, 55],
    wind_speed_10m: [7, 8],
    wind_direction_10m: [120, 135],
    precipitation_probability: [5, 10],
    visibility: [10000, 10000],
    weather_code: [1, 1],
    uv_index: [2, 3],
  },
  daily: {
    time: ['2026-09-13'],
    temperature_2m_max: [28],
    temperature_2m_min: [20],
    precipitation_probability_max: [15],
    weather_code: [1],
    uv_index_max: [6],
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
    name: 'Activity User',
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

test('buildActivityRecommendations returns walking, running, and cycling scores', () => {
  const activities = buildActivityRecommendations({
    temperature_c: 22,
    feels_like_c: 22,
    rain_probability_percent: 10,
    wind_speed_kmh: 8,
    uv_index: 3,
  });

  assert.equal(activities.length, 3);
  assert.deepEqual(
    activities.map((item) => item.activityId),
    ['walking', 'running', 'cycling'],
  );
  activities.forEach((item) => {
    assert.ok(item.score >= 0 && item.score <= 100);
    assert.ok(['excellent', 'good', 'moderate', 'poor', 'avoid'].includes(item.suitability));
    assert.ok(item.recommendation);
    assert.ok(item.reason);
  });
});

test('activity scores respond to different weather scenarios', () => {
  const scenarios = [
    {
      name: 'comfortable day',
      current: { temperature_c: 22, feels_like_c: 22, rain_probability_percent: 10, wind_speed_kmh: 8, uv_index: 3 },
      expectedScores: [90, 88, 92],
      expectedSuitability: ['excellent', 'excellent', 'excellent'],
    },
    {
      name: 'warm sunny day',
      current: { temperature_c: 28, feels_like_c: 29, rain_probability_percent: 10, wind_speed_kmh: 16, uv_index: 7 },
      expectedScores: [72, 68, 74],
      expectedSuitability: ['good', 'moderate', 'good'],
    },
    {
      name: 'hot day',
      current: { temperature_c: 36, feels_like_c: 38, rain_probability_percent: 10, wind_speed_kmh: 8, uv_index: 9 },
      expectedScores: [38, 32, 28],
      expectedSuitability: ['poor', 'poor', 'avoid'],
    },
    {
      name: 'heavy rain',
      current: { temperature_c: 24, feels_like_c: 24, rain_probability_percent: 85, wind_speed_kmh: 12, uv_index: 2 },
      expectedScores: [20, 15, 10],
      expectedSuitability: ['avoid', 'avoid', 'avoid'],
    },
    {
      name: 'strong wind',
      current: { temperature_c: 22, feels_like_c: 22, rain_probability_percent: 5, wind_speed_kmh: 65, uv_index: 3 },
      expectedScores: [20, 15, 10],
      expectedSuitability: ['avoid', 'avoid', 'avoid'],
    },
    {
      name: 'mixed rain and heat',
      current: { temperature_c: 30, feels_like_c: 31, rain_probability_percent: 45, wind_speed_kmh: 20, uv_index: 8 },
      expectedScores: [55, 50, 52],
      expectedSuitability: ['moderate', 'moderate', 'moderate'],
    },
  ];

  scenarios.forEach((scenario) => {
    const activities = buildActivityRecommendations(scenario.current);

    assert.deepEqual(
      activities.map((activity) => activity.score),
      scenario.expectedScores,
      `${scenario.name}: scores`,
    );
    assert.deepEqual(
      activities.map((activity) => activity.suitability),
      scenario.expectedSuitability,
      `${scenario.name}: suitability`,
    );
  });
});

test('activity endpoint returns structured activity data', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3020;

  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    return new Response(JSON.stringify(providerPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const server = await startServer(port);

  try {
    const token = await register(`activity-${Date.now()}@test.com`, port);
    const result = await request(
      'GET',
      '/api/v1/weather/activity?lat=6.9271&lon=79.8612',
      undefined,
      token,
      port,
    );

    assert.equal(result.status, 200);
    assert.equal(result.payload.activities.length, 3);
    assert.ok(result.payload.overallActivity);
    assert.ok(result.payload.bestTime);
    assert.equal(result.payload.source, 'activity_rules_v1');
    assert.equal(result.payload.location.latitude, 6.9271);
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('activity endpoint validates coordinates', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const port = 3021;
  const server = await startServer(port);
  try {
    const token = await register(`activity-invalid-${Date.now()}@test.com`, port);
    const result = await request('GET', '/api/v1/weather/activity?lat=120&lon=79', undefined, token, port);
    assert.equal(result.status, 400);
    assert.equal(result.payload.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
