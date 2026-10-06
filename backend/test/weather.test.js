const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');
const { clearWeatherCache, getCurrentWeather } = require('../src/services/weather.service');
const { fetchOpenMeteo, normalizeProviderPayload } = require('../src/services/weather-provider.service');
const { assessDestinationWeather } = require('../src/services/travel-risk.service');

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

function weatherFixture({
  temperature = 25,
  feelsLike = 25,
  windSpeed = 10,
  rainProbability = 10,
  visibilityKm = 10,
  uvIndex = 3,
  weatherCode = 0,
} = {}) {
  return {
    ...providerPayload,
    current: {
      ...providerPayload.current,
      temperature_2m: temperature,
      apparent_temperature: feelsLike,
      wind_speed_10m: windSpeed,
      weather_code: weatherCode,
      uv_index: uvIndex,
    },
    hourly: {
      ...providerPayload.hourly,
      precipitation_probability: [0, rainProbability],
      visibility: [visibilityKm * 1000, visibilityKm * 1000],
    },
  };
}

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
    precipitation_mm: undefined,
    visibility_km: 8,
    condition: 'partly-cloudy',
    conditionLabel: 'Partly Cloudy',
    observed_at: '2026-09-13T08:00',
  });
  assert.equal(normalized.hourly[1].rainProbability, 75);
  assert.equal(normalized.daily[0].maxTempC, 33);
  assert.equal(normalized.daily[0].condition, 'rainy');
});

test('weather normalization preserves valid extremes and avoids invalid optional values', () => {
  const normalized = normalizeProviderPayload({
    timezone: 'UTC',
    current: {
      time: '2026-09-14T00:00',
      temperature_2m: -40,
      apparent_temperature: -45,
      relative_humidity_2m: 100,
      wind_speed_10m: 0,
      wind_direction_10m: 360,
      weather_code: 999,
      uv_index: 0,
    },
    hourly: {
      time: ['2026-09-14T00:00', '2026-09-14T01:00'],
      temperature_2m: [-40, -39],
      apparent_temperature: [-45, -44],
      relative_humidity_2m: [100, 99],
      wind_speed_10m: [0, 1],
      wind_direction_10m: [360, 0],
      precipitation_probability: [0, 100],
      visibility: [null, 0],
      weather_code: [999, 0],
      uv_index: [0, 1],
    },
    daily: {
      time: ['2026-09-14', '2026-09-15'],
      temperature_2m_max: [-35, -30],
      temperature_2m_min: [-45, -40],
      precipitation_probability_max: [0, 100],
      weather_code: [999, 0],
      uv_index_max: [0, 1],
    },
  });

  assert.equal(normalized.current.temperature_c, -40);
  assert.equal(normalized.current.humidity_percent, 100);
  assert.equal(normalized.current.visibility_km, null);
  assert.equal(normalized.current.condition, 'unknown');
  assert.equal(normalized.hourly[0].visibilityKm, null);
  assert.equal(normalized.hourly[1].visibilityKm, 0);
  assert.equal(normalized.daily[0].condition, 'unknown');
  assert.deepEqual(normalized.daily.map((day) => day.date), ['2026-09-14', '2026-09-15']);
});

test('weather normalization preserves a complete seven-day forecast', () => {
  const dailyDates = [
    '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16',
    '2026-09-17', '2026-09-18', '2026-09-19',
  ];
  const normalized = normalizeProviderPayload({
    ...providerPayload,
    daily: {
      time: dailyDates,
      temperature_2m_max: [33, 34, 32, 31, 30, 29, 28],
      temperature_2m_min: [25, 26, 24, 23, 22, 21, 20],
      precipitation_probability_max: [80, 20, 60, 10, 0, 90, 40],
      weather_code: [61, 0, 3, 2, 0, 65, 80],
      uv_index_max: [9, 10, 8, 7, 6, 5, 4],
    },
  });

  assert.equal(normalized.daily.length, 7);
  assert.deepEqual(normalized.daily.map((day) => day.date), dailyDates);
  assert.deepEqual(normalized.daily.map((day) => day.rainProbability), [80, 20, 60, 10, 0, 90, 40]);
  assert.equal(normalized.daily[5].condition, 'rainy');
});

test('provider failures become typed weather errors', async () => {
  await assert.rejects(
    fetchOpenMeteo(6.9, 79.8, async () => new Response('upstream failure', { status: 503 })),
    (error) => error.code === 'WEATHER_UNAVAILABLE' && error.status === 503,
  );

  await assert.rejects(
    fetchOpenMeteo(6.9, 79.8, async () => new Response('{invalid json', { status: 200 })),
    (error) => error.code === 'WEATHER_INVALID_RESPONSE' && error.status === 503,
  );

  const timeoutError = new Error('aborted');
  timeoutError.name = 'AbortError';
  await assert.rejects(
    fetchOpenMeteo(6.9, 79.8, async () => { throw timeoutError; }),
    (error) => error.message === 'Weather provider timed out' && error.code === 'WEATHER_UNAVAILABLE',
  );
});

test('destination risk assessment ignores missing visibility readings', () => {
  const result = assessDestinationWeather({
    temperature_c: 20,
    feels_like_c: 20,
    rain_probability_percent: 0,
    wind_speed_kmh: 10,
    uv_index: 3,
    visibility_km: null,
    condition: 'sunny',
    conditionLabel: 'Clear Sky',
  });

  assert.equal(result.riskLevel, 'low');
  assert.equal(result.factors.some((factor) => factor.type === 'visibility'), false);
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
    assert.equal(forecast.payload.daily[0].rainProbability, 80);
    
    assert.equal(hourly.status, 200);
    assert.equal(hourly.payload.hourlyForecast[1].temperature, 31.5);
    assert.equal(hourly.payload.hourlyForecast[1].feelsLike, 34.2);
    assert.equal(hourly.payload.hourlyForecast[1].humidity, 72);
    assert.equal(hourly.payload.hourlyForecast[1].uvLevel, 8);
    assert.equal(hourly.payload.hourlyForecast[1].rainProbability, 75);
    
    assert.equal(providerCalls, 1);
    assert.equal(forecast.payload.cached, true);
    assert.equal(hourly.payload.cached, undefined); // Our getHourlyForecast mapped it directly, doesn't pass cached boolean by default, wait, I didn't include data_freshness and cached in getHourlyForecast, which is fine since the req didn't ask for it.
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('weather cache refreshes provider data after its configured TTL', async () => {
  clearWeatherCache();
  const originalFetch = global.fetch;
  const originalNow = Date.now;
  const originalTtl = process.env.WEATHER_CACHE_TTL_MS;
  let now = 1_000;
  let providerCalls = 0;
  Date.now = () => now;
  process.env.WEATHER_CACHE_TTL_MS = '100';
  global.fetch = async () => {
    providerCalls += 1;
    return new Response(JSON.stringify(providerPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const fresh = await getCurrentWeather(6.9271, 79.8612);
    const cached = await getCurrentWeather(6.9271, 79.8612);
    now += 100;
    const refreshed = await getCurrentWeather(6.9271, 79.8612);

    assert.equal(fresh.cached, false);
    assert.equal(cached.cached, true);
    assert.equal(refreshed.cached, false);
    assert.equal(providerCalls, 2);
  } finally {
    global.fetch = originalFetch;
    Date.now = originalNow;
    if (originalTtl === undefined) delete process.env.WEATHER_CACHE_TTL_MS;
    else process.env.WEATHER_CACHE_TTL_MS = originalTtl;
    clearWeatherCache();
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

test('destination endpoint returns structured data for Travel Safety AI', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3012;
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    return new Response(JSON.stringify(providerPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const server = await startServer(port);

  try {
    const token = await register(`dest-weather-${Date.now()}@test.com`, port);
    const result = await request('GET', '/api/v1/weather/destination?lat=6.9271&lon=79.8612&name=Kandy', undefined, token, port);

    assert.equal(result.status, 200);
    assert.equal(result.payload.success, true);
    
    assert.deepEqual(result.payload.destination, {
      latitude: 6.9271,
      longitude: 79.8612,
      name: 'Kandy'
    });

    assert.equal(result.payload.weather.temperature, 31.5);
    assert.equal(result.payload.weather.feelsLike, 34.2);
    assert.equal(result.payload.weather.condition, 'Partly Cloudy');
    assert.equal(result.payload.weather.humidity, 72);
    assert.equal(result.payload.weather.windSpeed, 18);
    assert.equal(result.payload.weather.windDirection, 135);
    assert.equal(result.payload.weather.uvIndex, 8);
    assert.equal(result.payload.weather.rainProbability, 75);
    assert.equal(result.payload.weather.visibility, 8);
    assert.equal(result.payload.riskAssessment.riskLevel, 'low');
    assert.ok(result.payload.riskAssessment.score >= 0 && result.payload.riskAssessment.score <= 100);
    assert.ok(result.payload.riskAssessment.factors.some((factor) => factor.type === 'rain'));
    assert.ok(result.payload.riskAssessment.summary.includes('Kandy'));
    
    assert.equal(result.payload.forecast.length, 1);
    assert.equal(result.payload.forecast[0].date, '2026-09-13');
    assert.equal(result.payload.forecast[0].maxTemp, 33);
    assert.equal(result.payload.forecast[0].minTemp, 25);
    assert.equal(result.payload.forecast[0].rainProbability, 80);
    
    assert.ok(result.payload.timestamp);
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('travel compare classifies low, moderate, and high destination weather risk', async () => {
  resetMemoryStore();
  clearWeatherCache();
  const originalFetch = global.fetch;
  const port = 3013;
  const originWeather = weatherFixture();
  const scenarios = [
    {
      riskLevel: 'low',
      score: 6,
      expectedFactors: ['stable'],
      origin: { latitude: 6.9, longitude: 79.8, label: 'Origin' },
      destination: { latitude: 7.1, longitude: 80.1, label: 'Low-risk destination' },
      weather: weatherFixture(),
    },
    {
      riskLevel: 'moderate',
      score: 46,
      expectedFactors: ['heat', 'rain'],
      origin: { latitude: 6.91, longitude: 79.81, label: 'Origin' },
      destination: { latitude: 7.11, longitude: 80.11, label: 'Moderate-risk destination' },
      weather: weatherFixture({ temperature: 33, feelsLike: 36, rainProbability: 60 }),
    },
    {
      riskLevel: 'high',
      score: 100,
      expectedFactors: ['storm', 'heat', 'rain', 'wind', 'uv', 'visibility', 'temperature-change'],
      origin: { latitude: 6.92, longitude: 79.82, label: 'Origin' },
      destination: { latitude: 7.12, longitude: 80.12, label: 'High-risk destination' },
      weather: weatherFixture({
        temperature: 40,
        feelsLike: 42,
        windSpeed: 50,
        rainProbability: 95,
        visibilityKm: 2,
        uvIndex: 9,
        weatherCode: 95,
      }),
    },
  ];
  global.fetch = async (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    const latitude = Number(new URL(String(url)).searchParams.get('latitude'));
    const scenario = scenarios.find(({ origin, destination }) =>
      Math.abs(latitude - origin.latitude) < 0.001 || Math.abs(latitude - destination.latitude) < 0.001
    );
    const isDestination = scenario && Math.abs(latitude - scenario.destination.latitude) < 0.001;
    return new Response(JSON.stringify(isDestination ? scenario.weather : originWeather), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const server = await startServer(port);

  try {
    const token = await register(`travel-risk-${Date.now()}@test.com`, port);
    for (const scenario of scenarios) {
      clearWeatherCache();
      const result = await request('POST', '/api/v1/travel/compare', {
        origin: scenario.origin,
        destination: scenario.destination,
      }, token, port);

      assert.equal(result.status, 200);
      assert.equal(result.payload.riskLevel, scenario.riskLevel);
      assert.equal(result.payload.score, scenario.score);
      assert.equal(result.payload.origin.label, scenario.origin.label);
      assert.equal(result.payload.destination.label, scenario.destination.label);
      assert.equal(result.payload.origin.temperature, originWeather.current.temperature_2m);
      assert.equal(result.payload.destination.temperature, scenario.weather.current.temperature_2m);
      assert.equal(
        result.payload.comparison.temperatureDelta,
        scenario.weather.current.temperature_2m - originWeather.current.temperature_2m,
      );
      assert.ok(result.payload.summary.includes(scenario.destination.label));
      assert.ok(Array.isArray(result.payload.factors));
      for (const factorType of scenario.expectedFactors) {
        assert.ok(
          result.payload.factors.some((factor) => factor.type === factorType),
          `Expected ${factorType} factor for ${scenario.riskLevel} weather`,
        );
      }
    }
  } finally {
    global.fetch = originalFetch;
    clearWeatherCache();
    await new Promise((resolve) => server.close(resolve));
  }
});
