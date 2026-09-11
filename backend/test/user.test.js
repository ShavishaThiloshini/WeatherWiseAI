const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');

const request = async (method, path, body, token, port = 3006) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, payload: await response.json() };
};

function startServer(port) {
  return new Promise((resolve) => {
    const server = app.listen(port, () => resolve(server));
  });
}

async function register(email, port) {
  const response = await request('POST', '/api/v1/auth/register', {
    name: 'Day 6 User', email, password: 'secret123',
  }, undefined, port);
  return response.payload.token;
}

test('user profile and preferences are authenticated and isolated', async () => {
  resetMemoryStore();
  const port = 3006;
  const server = await startServer(port);
  try {
    const firstToken = await register(`user-${Date.now()}@test.com`, port);
    const secondToken = await register(`other-${Date.now()}@test.com`, port);

    const unauthorized = await request('GET', '/api/v1/users/me', undefined, undefined, port);
    assert.equal(unauthorized.status, 401);

    const profile = await request('GET', '/api/v1/users/me', undefined, firstToken, port);
    assert.equal(profile.status, 200);
    assert.equal(profile.payload.user.name, 'Day 6 User');
    assert.equal(profile.payload.user.password_hash, undefined);

    const updated = await request('PATCH', '/api/v1/users/me', { name: 'Updated User' }, firstToken, port);
    assert.equal(updated.status, 200);
    assert.equal(updated.payload.user.name, 'Updated User');

    const defaults = await request('GET', '/api/v1/users/preferences', undefined, firstToken, port);
    assert.equal(defaults.status, 200);
    assert.equal(defaults.payload.preferences.units, 'metric');

    const saved = await request('PATCH', '/api/v1/users/preferences', {
      cold_tolerance: 'low', preferred_activity: 'running', units: 'imperial', notifications_enabled: false,
    }, firstToken, port);
    assert.equal(saved.status, 200);
    assert.equal(saved.payload.preferences.preferred_activity, 'running');
    assert.equal(saved.payload.preferences.notifications_enabled, false);

    const otherDefaults = await request('GET', '/api/v1/users/preferences', undefined, secondToken, port);
    assert.equal(otherDefaults.payload.preferences.preferred_activity, null);
    assert.equal(otherDefaults.payload.preferences.units, 'metric');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('preferences reject invalid values', async () => {
  resetMemoryStore();
  const port = 3007;
  const server = await startServer(port);
  try {
    const token = await register(`invalid-pref-${Date.now()}@test.com`, port);
    const response = await request('PATCH', '/api/v1/users/preferences', {
      units: 'kelvin', notifications_enabled: 'yes',
    }, token, port);
    assert.equal(response.status, 400);
    assert.equal(response.payload.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
