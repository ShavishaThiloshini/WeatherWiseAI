const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');

const weather = {
  location: { label: 'Colombo', latitude: 6.9271, longitude: 79.8612, timezone: 'Asia/Colombo' },
  current: { temperature_c: 29, rain_probability_percent: 40 },
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
  return { status: response.status, payload: await response.json() };
}

async function register(server) {
  const result = await request(server, 'POST', '/api/v1/auth/register', {
    name: 'Assistant User',
    email: `assistant-${Date.now()}-${Math.random()}@test.com`,
    password: 'secret123',
  });
  return result.payload.token;
}

test('AI assistant requires authentication and validates request context', async () => {
  resetMemoryStore();
  const server = await startServer();
  try {
    const unauthorized = await request(server, 'POST', '/api/v1/ai/assistant', {
      question: 'Should I bring an umbrella?',
      weather,
    });
    assert.equal(unauthorized.status, 401);

    const token = await register(server);
    const invalid = await request(server, 'POST', '/api/v1/ai/assistant', {
      question: 'Should I bring an umbrella?',
      weather: { current: weather.current },
    }, token);
    assert.equal(invalid.status, 400);
    assert.equal(invalid.payload.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('AI assistant forwards the authenticated question and weather to the AI service', async () => {
  resetMemoryStore();
  const originalFetch = global.fetch;
  let aiRequest;
  global.fetch = async (url, options) => {
    if (String(url).includes('/api/v1/')) return originalFetch(url, options);
    aiRequest = JSON.parse(options.body);
    return new Response(JSON.stringify({
      answer: 'Carry an umbrella because rain is possible.',
      source: 'deterministic_rules',
      recommendations: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const server = await startServer();
  try {
    const token = await register(server);
    const result = await request(server, 'POST', '/api/v1/ai/assistant', {
      question: '  Should I bring an umbrella?  ',
      weather,
    }, token);
    assert.equal(result.status, 200);
    assert.equal(result.payload.answer, 'Carry an umbrella because rain is possible.');
    assert.deepEqual(aiRequest, { question: 'Should I bring an umbrella?', weather });
  } finally {
    global.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  }
});
