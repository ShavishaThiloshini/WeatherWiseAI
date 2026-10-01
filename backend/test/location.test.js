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
    name: 'Shavi Test',
    email: `shavi-${Date.now()}-${Math.random()}@test.com`,
    password: 'secret123',
  });
  return result.payload.token;
}

test('locations complete crud lifecycle', async () => {
  resetMemoryStore();
  const port = 3040;
  const server = await startServer(port);
  try {
    const token = await register(port);
    const tokenB = await register(port);

    // Create
    const created = await request(port, 'POST', '/api/v1/locations', {
      label: 'Colombo', latitude: 6.9271, longitude: 79.8612
    }, token);
    assert.equal(created.status, 201);
    const locId = created.payload.location.id;

    // Get Single
    const getSingle = await request(port, 'GET', `/api/v1/locations/${locId}`, undefined, token);
    assert.equal(getSingle.status, 200);
    assert.equal(getSingle.payload.location.label, 'Colombo');

    // Get Single (Unauthorized user B)
    const getSingleB = await request(port, 'GET', `/api/v1/locations/${locId}`, undefined, tokenB);
    assert.equal(getSingleB.status, 404);

    // Update (Valid)
    const updateValid = await request(port, 'PUT', `/api/v1/locations/${locId}`, { label: 'Colombo City', latitude: 6.9 }, token);
    assert.equal(updateValid.status, 200);
    assert.equal(updateValid.payload.location.label, 'Colombo City');
    assert.equal(updateValid.payload.location.latitude, 6.9);

    // Update (Invalid coordinates)
    const updateInvalid = await request(port, 'PUT', `/api/v1/locations/${locId}`, { latitude: 1000 }, token);
    assert.equal(updateInvalid.status, 400);

    // Update (Unauthorized user B)
    const updateB = await request(port, 'PUT', `/api/v1/locations/${locId}`, { label: 'Hacked' }, tokenB);
    assert.equal(updateB.status, 404);

    // Delete (Unauthorized user B)
    const deleteB = await request(port, 'DELETE', `/api/v1/locations/${locId}`, undefined, tokenB);
    assert.equal(deleteB.status, 404);

    // Delete (Valid)
    const deleteValid = await request(port, 'DELETE', `/api/v1/locations/${locId}`, undefined, token);
    assert.equal(deleteValid.status, 204);

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
