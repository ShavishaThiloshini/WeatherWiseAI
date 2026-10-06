const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');

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
    name: 'Preference User',
    email: `preference-${Date.now()}-${Math.random()}@test.com`,
    password: 'secret123',
  });
  assert.equal(result.status, 201);
  return result.payload.token;
}

test('user preferences require authentication and return defaults for a new user', async () => {
  resetMemoryStore();
  const server = await startServer();
  try {
    const unauthorized = await request(server, 'GET', '/api/v1/users/preferences');
    assert.equal(unauthorized.status, 401);

    const token = await register(server);
    const result = await request(server, 'GET', '/api/v1/users/preferences', undefined, token);
    assert.equal(result.status, 200);
    assert.deepEqual(result.payload.preferences, {
      userId: result.payload.preferences.userId,
      coldTolerance: 'medium',
      preferredActivity: null,
      preferredActivityTime: null,
      units: 'metric',
      notificationsEnabled: true,
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('partial preference updates preserve existing values and explicit null clears optional values', async () => {
  resetMemoryStore();
  const server = await startServer();
  try {
    const token = await register(server);
    const initial = await request(server, 'PATCH', '/api/v1/users/preferences', {
      preferredActivity: 'Running',
      preferredActivityTime: '17:00',
      coldTolerance: 'high',
    }, token);
    assert.equal(initial.status, 200);
    assert.equal(initial.payload.preferences.preferredActivity, 'Running');
    assert.equal(initial.payload.preferences.preferredActivityTime, '17:00');

    const partial = await request(server, 'PATCH', '/api/v1/users/preferences', {
      units: 'imperial',
    }, token);
    assert.equal(partial.status, 200);
    assert.equal(partial.payload.preferences.units, 'imperial');
    assert.equal(partial.payload.preferences.coldTolerance, 'high');
    assert.equal(partial.payload.preferences.preferredActivity, 'Running');
    assert.equal(partial.payload.preferences.preferredActivityTime, '17:00');

    const cleared = await request(server, 'PATCH', '/api/v1/users/preferences', {
      preferredActivity: null,
      preferredActivityTime: null,
    }, token);
    assert.equal(cleared.status, 200);
    assert.equal(cleared.payload.preferences.preferredActivity, null);
    assert.equal(cleared.payload.preferences.preferredActivityTime, null);

    const persisted = await request(server, 'GET', '/api/v1/users/preferences', undefined, token);
    assert.equal(persisted.payload.preferences.units, 'imperial');
    assert.equal(persisted.payload.preferences.preferredActivity, null);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('preference updates reject invalid values and empty patches', async () => {
  resetMemoryStore();
  const server = await startServer();
  try {
    const token = await register(server);
    for (const body of [
      { coldTolerance: 'freezing' },
      { units: 'kelvin' },
      { notificationsEnabled: 'yes' },
      {},
    ]) {
      const result = await request(server, 'PATCH', '/api/v1/users/preferences', body, token);
      assert.equal(result.status, 400);
      assert.equal(result.payload.error.code, 'VALIDATION_ERROR');
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
