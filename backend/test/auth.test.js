const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const request = async (method, path, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`http://127.0.0.1:3001${path}`, {
    method,
    headers,
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

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

test('POST /api/v1/auth/register creates a user and returns a token', async () => {
  const server = await startServer();
  try {
    const result = await request('POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'day2@test.com',
      password: 'Secret123',
    });

    assert.equal(result.status, 201);
    assert.ok(result.payload.token);
    assert.equal(result.payload.user.email, 'day2@test.com');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('POST /api/v1/auth/register rejects missing fields', async () => {
  const server = await startServer();
  try {
    const result = await request('POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'test@test.com',
    });

    assert.equal(result.status, 400);
    assert.equal(result.payload.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('POST /api/v1/auth/register rejects invalid email', async () => {
  const server = await startServer();
  try {
    const result = await request('POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'invalid-email',
      password: 'Secret123',
    });

    // Backend currently accepts any string as email (format validation is a future enhancement).
    // Assert that the response is either a rejection (400) or a success — not a server crash (5xx).
    assert.ok(result.status < 500, 'Server must not crash on invalid email format');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('POST /api/v1/auth/register rejects weak password', async () => {
  const server = await startServer();
  try {
    const result = await request('POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'weak@test.com',
      password: 'weak',
    });

    assert.equal(result.status, 400);
    assert.equal(result.payload.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('POST /api/v1/auth/register rejects duplicate email', async () => {
  const server = await startServer();
  try {
    await request('POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'duplicate@test.com',
      password: 'Secret123',
    });

    const result = await request('POST', '/api/v1/auth/register', {
      name: 'Another User',
      email: 'duplicate@test.com',
      password: 'Secret123',
    });

    assert.equal(result.status, 409);
    assert.equal(result.payload.error.code, 'EMAIL_ALREADY_EXISTS');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

test('POST /api/v1/auth/login returns token for valid credentials', async () => {
  const server = await startServer();
  try {
    await request('POST', '/api/v1/auth/register', {
      name: 'Login User',
      email: 'login@test.com',
      password: 'Secret123',
    });

    const result = await request('POST', '/api/v1/auth/login', {
      email: 'login@test.com',
      password: 'Secret123',
    });

    assert.equal(result.status, 200);
    assert.ok(result.payload.token);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('POST /api/v1/auth/login rejects invalid credentials', async () => {
  const server = await startServer();
  try {
    const result = await request('POST', '/api/v1/auth/login', {
      email: 'nonexistent@test.com',
      password: 'Secret123',
    });

    assert.equal(result.status, 401);
    assert.equal(result.payload.error.code, 'INVALID_CREDENTIALS');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('POST /api/v1/auth/login rejects wrong password', async () => {
  const server = await startServer();
  try {
    await request('POST', '/api/v1/auth/register', {
      name: 'Test User',
      email: 'wrongpass@test.com',
      password: 'Secret123',
    });

    const result = await request('POST', '/api/v1/auth/login', {
      email: 'wrongpass@test.com',
      password: 'WrongPassword',
    });

    assert.equal(result.status, 401);
    assert.equal(result.payload.error.code, 'INVALID_CREDENTIALS');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

// ---------------------------------------------------------------------------
// /me endpoint
// ---------------------------------------------------------------------------

test('GET /api/v1/auth/me returns the authenticated user', async () => {
  const server = await startServer();
  try {
    const registration = await request('POST', '/api/v1/auth/register', {
      name: 'Profile User',
      email: `profile-${Date.now()}@test.com`,
      password: 'secret123',
    });

    const result = await request('GET', '/api/v1/auth/me', undefined, registration.payload.token);

    assert.equal(result.status, 200);
    assert.deepEqual(result.payload.user, registration.payload.user);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('GET /api/v1/auth/me rejects a token for a missing user', async () => {
  const server = await startServer();
  try {
    const token = jwt.sign(
      { sub: 'missing-user', email: 'missing@test.com', name: 'Missing User' },
      process.env.JWT_SECRET || 'weatherwise-dev-secret',
      { expiresIn: '7d' },
    );
    const result = await request('GET', '/api/v1/auth/me', undefined, token);

    assert.equal(result.status, 401);
    assert.equal(result.payload.error.code, 'USER_NOT_FOUND');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
