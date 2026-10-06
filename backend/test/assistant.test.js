const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');

async function startServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return { server, port: server.address().port };
}

async function request(port, method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, payload: await response.json() };
}

async function register(port) {
  const result = await request(port, 'POST', '/api/v1/auth/register', {
    name: 'Assistant User',
    email: `assistant-${Date.now()}-${Math.random()}@test.com`,
    password: 'secret123',
  });
  assert.equal(result.status, 201);
  return result.payload.token;
}

test('assistant endpoint requires authentication and validates question/weather input', async () => {
  resetMemoryStore();
  const { server, port } = await startServer();
  try {
    const unauthorized = await request(port, 'POST', '/api/v1/ai/assistant', {
      question: 'Will it rain?',
      weather: {},
    });
    const token = await register(port);
    const invalidQuestion = await request(port, 'POST', '/api/v1/ai/assistant', {
      question: '   ',
      weather: { location: {}, current: {} },
    }, token);
    const missingContext = await request(port, 'POST', '/api/v1/ai/assistant', {
      question: 'Will it rain?',
      weather: {},
    }, token);

    assert.equal(unauthorized.status, 401);
    assert.equal(invalidQuestion.status, 400);
    assert.equal(invalidQuestion.payload.error.code, 'VALIDATION_ERROR');
    assert.equal(missingContext.status, 400);
    assert.equal(missingContext.payload.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('assistant endpoint forwards normalized question and weather context to AI service', async () => {
  resetMemoryStore();
  const originalFetch = global.fetch;
  const { server, port } = await startServer();
  let forwarded;
  global.fetch = async (url, options) => {
    if (String(url).startsWith(`http://127.0.0.1:${port}`)) return originalFetch(url, options);
    forwarded = { url: String(url), body: JSON.parse(options.body) };
    return new Response(JSON.stringify({
      answer: 'There is a 75% chance of rain soon. Bring an umbrella.',
      source: 'deterministic_rules',
      recommendations: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const token = await register(port);
    const weather = {
      location: { label: 'Colombo', latitude: 6.9, longitude: 79.8 },
      current: { temperature_c: 29, rain_probability_percent: 75 },
      forecast: { hours: [{ rain_probability_percent: 80 }], days: [] },
    };
    const result = await request(port, 'POST', '/api/v1/ai/assistant', {
      question: '  Will it rain soon?  ',
      weather,
    }, token);

    assert.equal(result.status, 200);
    assert.match(result.payload.answer, /75% chance of rain/);
    assert.equal(forwarded.url, 'http://127.0.0.1:8001/assistant');
    assert.deepEqual(forwarded.body, { question: 'Will it rain soon?', weather });
  } finally {
    global.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('assistant endpoint returns an explicit unavailable error when AI service fails', async () => {
  resetMemoryStore();
  const originalFetch = global.fetch;
  const { server, port } = await startServer();
  global.fetch = async (url, options) => {
    if (String(url).startsWith(`http://127.0.0.1:${port}`)) return originalFetch(url, options);
    throw new Error('AI offline');
  };
  try {
    const token = await register(port);
    const result = await request(port, 'POST', '/api/v1/ai/assistant', {
      question: 'Will it rain?',
      weather: { location: { label: 'Colombo' }, current: { temperature_c: 30 } },
    }, token);

    assert.equal(result.status, 503);
    assert.equal(result.payload.error.code, 'ASSISTANT_UNAVAILABLE');
  } finally {
    global.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  }
});
