const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

const request = async (method, path, body, token, port = 3002) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : null;
  return { status: res.status, payload };
};

async function startServer(port) {
  const server = app.listen(port);
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
}

async function register(email, port = 3002) {
  const result = await request('POST', '/api/v1/auth/register', {
    name: 'Location User',
    email,
    password: 'secret123',
  }, undefined, port);
  return result.payload.token;
}

test('location CRUD requires auth and only returns the owning user locations', async () => {
  const server = await startServer(3002);
  try {
    const unauthorized = await request('GET', '/api/v1/locations');
    assert.equal(unauthorized.status, 401);

    const firstToken = await register(`location-${Date.now()}@test.com`);
    const secondToken = await register(`other-${Date.now()}@test.com`);
    const created = await request('POST', '/api/v1/locations', {
      label: 'Home',
      latitude: 6.9271,
      longitude: 79.8612,
      timezone: 'Asia/Colombo',
      is_default: true,
    }, firstToken);

    assert.equal(created.status, 201);
    assert.equal(created.payload.location.label, 'Home');
    assert.equal(created.payload.location.is_default, true);

    const list = await request('GET', '/api/v1/locations', undefined, firstToken);
    assert.equal(list.status, 200);
    assert.equal(list.payload.locations.length, 1);

    const otherList = await request('GET', '/api/v1/locations', undefined, secondToken);
    assert.equal(otherList.status, 200);
    assert.equal(otherList.payload.locations.length, 0);

    const id = created.payload.location.id;
    const updated = await request('PATCH', `/api/v1/locations/${id}`, {
      label: 'University',
    }, firstToken);
    assert.equal(updated.status, 200);
    assert.equal(updated.payload.location.label, 'University');

    const forbiddenByOwnership = await request('GET', `/api/v1/locations/${id}`, undefined, secondToken);
    assert.equal(forbiddenByOwnership.status, 404);

    const deleted = await request('DELETE', `/api/v1/locations/${id}`, undefined, firstToken);
    assert.equal(deleted.status, 204);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('location creation validates coordinate ranges', async () => {
  const server = await startServer(3003);
  try {
    const token = await register(`invalid-location-${Date.now()}@test.com`, 3003);
    const result = await request('POST', '/api/v1/locations', {
      label: 'Invalid',
      latitude: 91,
      longitude: 0,
    }, token, 3003);
    assert.equal(result.status, 400);
    assert.equal(result.payload.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
