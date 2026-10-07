const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { resetMemoryStore } = require('../src/db');

async function startServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return { server, port: server.address().port };
}

async function stopServer(server) {
  const closed = new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  server.closeAllConnections();
  await closed;
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
  const response = await request(port, 'POST', '/api/v1/auth/register', {
    name: 'History User',
    email: `history-${Date.now()}-${Math.random()}@test.com`,
    password: 'secret123',
  });
  return response.payload.token;
}

async function createLocation(port, token, label = 'Colombo') {
  const response = await request(port, 'POST', '/api/v1/locations', {
    label,
    latitude: 6.9271,
    longitude: 79.8612,
    timezone: 'Asia/Colombo',
  }, token);
  return response.payload.location;
}

test('authenticated weather history can be saved, updated, filtered, and paginated', async () => {
  resetMemoryStore();
  const { server, port } = await startServer();
  try {
    const token = await register(port);
    const location = await createLocation(port, token);
    const summary = {
      locationId: location.id,
      summaryDate: '2026-10-01',
      avgTemperatureC: 28.4,
      maxTemperatureC: 32,
      minTemperatureC: 25.2,
      totalRainMm: 4.5,
      dominantCondition: 'partly-cloudy',
    };

    const created = await request(port, 'POST', '/api/v1/history', summary, token);
    assert.equal(created.status, 201);
    assert.equal(created.payload.history.locationLabel, 'Colombo');
    assert.equal(created.payload.history.avgTemperatureC, 28.4);

    const updated = await request(port, 'POST', '/api/v1/history', {
      ...summary,
      avgTemperatureC: 29,
    }, token);
    assert.equal(updated.status, 201);
    assert.equal(updated.payload.history.id, created.payload.history.id);

    await request(port, 'POST', '/api/v1/history', {
      ...summary,
      summaryDate: '2026-10-02',
    }, token);
    const filtered = await request(
      port,
      'GET',
      `/api/v1/history?locationId=${location.id}&from=2026-10-01&to=2026-10-02&limit=1`,
      undefined,
      token,
    );
    assert.equal(filtered.status, 200);
    assert.equal(filtered.payload.history.length, 1);
    assert.equal(filtered.payload.history[0].summaryDate, '2026-10-02');
    assert.deepEqual(filtered.payload.pagination, { limit: 1, offset: 0, total: 2 });
  } finally {
    await stopServer(server);
  }
});

test('weather history requires authentication, valid summaries, and an owned location', async () => {
  resetMemoryStore();
  const { server, port } = await startServer();
  try {
    const token = await register(port);
    const location = await createLocation(port, token);
    const body = {
      locationId: location.id,
      summaryDate: '2026-10-01',
      avgTemperatureC: 28,
    };

    assert.equal((await request(port, 'GET', '/api/v1/history')).status, 401);
    assert.equal((await request(port, 'POST', '/api/v1/history', body)).status, 401);

    const invalidDate = await request(port, 'POST', '/api/v1/history', {
      ...body,
      summaryDate: '2026-02-30',
    }, token);
    assert.equal(invalidDate.status, 400);

    const invalidRainfall = await request(port, 'POST', '/api/v1/history', {
      ...body,
      totalRainMm: -1,
    }, token);
    assert.equal(invalidRainfall.status, 400);

    const unowned = await request(port, 'POST', '/api/v1/history', {
      ...body,
      locationId: 'not-owned',
    }, token);
    assert.equal(unowned.status, 404);

    const otherToken = await register(port);
    const otherHistory = await request(port, 'GET', '/api/v1/history', undefined, otherToken);
    assert.deepEqual(otherHistory.payload.history, []);
    assert.equal(otherHistory.payload.pagination.total, 0);

    const invalidPage = await request(port, 'GET', '/api/v1/history?limit=101', undefined, token);
    assert.equal(invalidPage.status, 400);
  } finally {
    await stopServer(server);
  }
});
