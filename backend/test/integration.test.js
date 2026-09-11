const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');

const request = async (method, path, body, token, port = 3004) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  return { status: response.status, payload };
};

async function register(email, port) {
  const result = await request('POST', '/api/v1/auth/register', {
    name: 'Integration User',
    email,
    password: 'secret123',
  }, undefined, port);
  return result.payload.token;
}

function startServer(port) {
  return new Promise((resolve) => {
    const server = app.listen(port, () => resolve(server));
  });
}

test('AI recommendation proxy forwards selected owned location', async () => {
  resetMemoryStore();
  const originalFetch = global.fetch;
  const port = 3004;
  const server = await startServer(port);
  try {
    const token = await register(`integration-${Date.now()}@test.com`, port);
    const location = await request('POST', '/api/v1/locations', {
      label: 'Home', latitude: 6.9271, longitude: 79.8612, timezone: 'Asia/Colombo', is_default: true,
    }, token, port);
    global.fetch = async (url, options) => {
      if (url === `http://127.0.0.1:${port}/api/v1/ai/recommend`) {
        return originalFetch(url, options);
      }
      assert.equal(url, 'http://127.0.0.1:8001/recommend');
      const body = JSON.parse(options.body);
      assert.equal(body.location.label, 'Home');
      assert.equal(body.current.temperature_c, 31);
      return new Response(JSON.stringify({ source: 'deterministic_rules', recommendations: [{ category: 'hydration' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    const result = await request('POST', '/api/v1/ai/recommend', {
      location_id: location.payload.location.id,
      current: { temperature_c: 31, condition: 'clear' },
    }, token, port);

    assert.equal(result.status, 200);
    assert.equal(result.payload.recommendations[0].category, 'hydration');
  } finally {
    global.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('AI proxy rejects another user location', async () => {
  resetMemoryStore();
  const port = 3005;
  const server = await startServer(port);
  try {
    const ownerToken = await register(`owner-${Date.now()}@test.com`, port);
    const otherToken = await register(`other-${Date.now()}@test.com`, port);
    const location = await request('POST', '/api/v1/locations', {
      label: 'Private Home', latitude: 6, longitude: 79, timezone: 'Asia/Colombo',
    }, ownerToken, port);
    const result = await request('POST', '/api/v1/weather/recommend', {
      location_id: location.payload.location.id,
      current: { temperature_c: 22 },
    }, otherToken, port);

    assert.equal(result.status, 404);
    assert.equal(result.payload.error.code, 'LOCATION_NOT_FOUND');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
