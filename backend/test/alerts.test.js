const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { memoryStore, resetMemoryStore } = require('../src/db');

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
  return { status: response.status, payload: response.status === 204 ? null : await response.json() };
}

async function register(port, email) {
  const result = await request(port, 'POST', '/api/v1/auth/register', {
    name: 'Alert User',
    email,
    password: 'secret123',
  });
  return result.payload.token;
}

test('alerts API lists active alerts and returns alert details for owned locations', async () => {
  resetMemoryStore();
  const port = 3040;
  const server = await startServer(port);
  try {
    const token = await register(port, `alerts-${Date.now()}@test.com`);
    const locationResult = await request(port, 'POST', '/api/v1/locations', {
      label: 'Home', latitude: 6.9271, longitude: 79.8612,
    }, token);
    const locationId = locationResult.payload.location.id;
    const createdAt = new Date().toISOString();
    memoryStore.alerts.push(
      {
        id: 'active-alert', user_id: memoryStore.users[0].id, location_id: locationId,
        alert_type: 'heavy_rain', severity: 'high', title: 'Heavy rain', reason: 'Rain is expected soon.',
        valid_from: createdAt, expires_at: null, is_active: true, created_at: createdAt,
      },
      {
        id: 'inactive-alert', user_id: memoryStore.users[0].id, location_id: locationId,
        alert_type: 'cold', severity: 'low', title: 'Cold conditions', reason: 'Temperatures are falling.',
        valid_from: createdAt, expires_at: createdAt, is_active: false, created_at: createdAt,
      },
    );

    const listed = await request(port, 'GET', '/api/v1/alerts', undefined, token);
    assert.equal(listed.status, 200);
    assert.deepEqual(listed.payload.alerts.map((alert) => alert.id), ['active-alert']);
    assert.equal(listed.payload.alerts[0].locationId, locationId);

    const detail = await request(port, 'GET', '/api/v1/alerts/active-alert', undefined, token);
    assert.equal(detail.status, 200);
    assert.equal(detail.payload.alert.reason, 'Rain is expected soon.');

    const allAlerts = await request(port, 'GET', '/api/v1/alerts?active=false', undefined, token);
    assert.equal(allAlerts.status, 200);
    assert.equal(allAlerts.payload.alerts.length, 2);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('alerts API requires authentication and hides alerts from other users', async () => {
  resetMemoryStore();
  const port = 3041;
  const server = await startServer(port);
  try {
    const ownerToken = await register(port, `owner-${Date.now()}@test.com`);
    const otherToken = await register(port, `other-${Date.now()}@test.com`);
    const locationResult = await request(port, 'POST', '/api/v1/locations', {
      label: 'Owner location', latitude: 6, longitude: 79,
    }, ownerToken);
    memoryStore.alerts.push({
      id: 'private-alert', user_id: memoryStore.users[0].id,
      location_id: locationResult.payload.location.id, alert_type: 'heat', severity: 'medium',
      title: 'Heat', reason: 'It is hot.', valid_from: new Date().toISOString(),
      expires_at: null, is_active: true, created_at: new Date().toISOString(),
    });

    const unauthenticated = await request(port, 'GET', '/api/v1/alerts');
    assert.equal(unauthenticated.status, 401);

    const otherUser = await request(port, 'GET', '/api/v1/alerts/private-alert', undefined, otherToken);
    assert.equal(otherUser.status, 404);
    assert.equal(otherUser.payload.error.code, 'ALERT_NOT_FOUND');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
