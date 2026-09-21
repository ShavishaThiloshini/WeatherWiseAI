const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');

async function startServer(port) {
  const server = app.listen(port);
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
}

async function request(port, method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    payload: response.status === 204 ? null : await response.json(),
  };
}

async function register(port) {
  const result = await request(port, 'POST', '/api/v1/auth/register', {
    name: 'Rahavi Test',
    email: `rahavi-${Date.now()}-${Math.random()}@test.com`,
    password: 'secret123',
  });
  return result.payload.token;
}

test('authenticated locations support create, list, and delete', async () => {
  resetMemoryStore();
  const port = 3030;
  const server = await startServer(port);
  try {
    const token = await register(port);
    const created = await request(port, 'POST', '/api/v1/locations', {
      label: 'Colombo', latitude: 6.9271, longitude: 79.8612, timezone: 'Asia/Colombo', isDefault: true,
    }, token);
    assert.equal(created.status, 201);
    assert.equal(created.payload.location.label, 'Colombo');

    const listed = await request(port, 'GET', '/api/v1/locations', undefined, token);
    assert.equal(listed.status, 200);
    assert.equal(listed.payload.locations.length, 1);
    assert.equal(listed.payload.locations[0].label, 'Colombo');

    const deleted = await request(port, 'DELETE', `/api/v1/locations/${created.payload.location.id}`, undefined, token);
    assert.equal(deleted.status, 204);
    const afterDelete = await request(port, 'GET', '/api/v1/locations', undefined, token);
    assert.equal(afterDelete.payload.locations.length, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('dashboard route forwards current weather to the AI recommendation service', async () => {
  resetMemoryStore();
  const originalFetch = global.fetch;
  const port = 3031;
  let aiPayload;
  global.fetch = async (url, options) => {
    if (String(url).startsWith(`http://127.0.0.1:${port}`)) return originalFetch(url, options);
    aiPayload = JSON.parse(options.body);
    return new Response(JSON.stringify({
      source: 'deterministic_rules',
      recommendations: [{ id: 'general-01', category: 'general', title: 'Good conditions', message: 'Stay aware.', severity: 'info', reason: 'Safe', priority: 'INFO', risk_level: 'SAFE', factors: [] }],
      alerts: [], analysis: {}, assistant_context: { summary: 'Good conditions' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const server = await startServer(port);
  try {
    const token = await register(port);
    const result = await request(port, 'POST', '/api/v1/dashboard', {
      location: { label: 'Colombo', latitude: 6.9, longitude: 79.8, timezone: 'Asia/Colombo' },
      current: { temperature_c: 29, rain_probability_percent: 20 },
    }, token);
    assert.equal(result.status, 200);
    assert.equal(result.payload.recommendations[0].category, 'general');
    assert.equal(aiPayload.current.temperature_c, 29);
  } finally {
    global.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('dashboard route returns a typed error when AI service is unavailable', async () => {
  resetMemoryStore();
  const originalFetch = global.fetch;
  const port = 3032;
  global.fetch = async (url, options) => {
    if (String(url).startsWith(`http://127.0.0.1:${port}`)) return originalFetch(url, options);
    throw new Error('AI offline');
  };
  const server = await startServer(port);
  try {
    const token = await register(port);
    const result = await request(port, 'POST', '/api/v1/dashboard', {
      location: { label: 'Colombo', latitude: 6.9, longitude: 79.8 },
      current: { temperature_c: 29 },
    }, token);
    assert.equal(result.status, 503);
    assert.equal(result.payload.error.code, 'RECOMMENDATION_UNAVAILABLE');
  } finally {
    global.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  }
});
