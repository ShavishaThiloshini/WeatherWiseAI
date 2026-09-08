const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

const request = async (method, path, body) => {
  const res = await fetch(`http://127.0.0.1:3001${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, payload };
};

async function startServer() {
  const server = app.listen(3001);
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
}

test('GET /api/v1/health returns ok', async () => {
  const server = await startServer();
  try {
    const result = await request('GET', '/api/v1/health');
    assert.equal(result.status, 200);
    assert.equal(result.payload.status, 'ok');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('POST /api/v1/auth/register creates a user and returns a token', async () => {
  const server = await startServer();
  try {
    const result = await request('POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'day2@test.com',
      password: 'secret123',
    });

    assert.equal(result.status, 201);
    assert.ok(result.payload.token);
    assert.equal(result.payload.user.email, 'day2@test.com');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('POST /api/v1/auth/login returns token for valid credentials', async () => {
  const server = await startServer();
  try {
    await request('POST', '/api/v1/auth/register', {
      name: 'Login User',
      email: 'login@test.com',
      password: 'secret123',
    });

    const result = await request('POST', '/api/v1/auth/login', {
      email: 'login@test.com',
      password: 'secret123',
    });

    assert.equal(result.status, 200);
    assert.ok(result.payload.token);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
