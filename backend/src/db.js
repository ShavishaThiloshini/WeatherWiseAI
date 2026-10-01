const { randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');
const fs = require('node:fs/promises');
const path = require('node:path');

const memoryStore = {
  users: [],
  locations: [],
  alerts: [],
};

let pool;

function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!databaseConfigured()) return null;
  if (!pool) pool = mysql.createPool(process.env.DATABASE_URL);
  return pool;
}

async function initializeDatabase() {
  const database = getPool();
  if (!database) return false;
  const schema = await fs.readFile(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  for (const statement of schema.split(';').map((item) => item.trim()).filter(Boolean)) {
    await database.query(statement);
  }
  return true;
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

function resetMemoryStore() {
  memoryStore.users = [];
  memoryStore.locations = [];
  memoryStore.alerts = [];
}

async function findUserByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const database = getPool();
  if (database) {
    const [rows] = await database.query('SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE email = ? LIMIT 1', [normalized]);
    return rows[0] || null;
  }
  return memoryStore.users.find((user) => user.email === normalized) || null;
}

async function findUserById(id) {
  const database = getPool();
  if (database) {
    const [rows] = await database.query('SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }
  return memoryStore.users.find((user) => user.id === id) || null;
}

async function createUser({ name, email, passwordHash }) {
  const user = {
    id: randomUUID(),
    name: String(name || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    password_hash: passwordHash,
    passwordHash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const database = getPool();
  if (database) {
    await database.execute('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)', [user.id, user.name, user.email, user.password_hash]);
    return user;
  }

  memoryStore.users.push(user);
  return user;
}

async function listLocations(userId) {
  const database = getPool();
  if (database) {
    const [rows] = await database.query('SELECT id, label, latitude, longitude, timezone, is_default AS isDefault, created_at AS createdAt FROM locations WHERE user_id = ? ORDER BY is_default DESC, created_at ASC', [userId]);
    return rows;
  }
  return memoryStore.locations.filter((location) => location.user_id === userId);
}

async function createLocation(userId, location) {
  const record = {
    id: randomUUID(),
    user_id: userId,
    label: String(location.label).trim(),
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    timezone: String(location.timezone || 'UTC'),
    is_default: Boolean(location.isDefault),
    created_at: new Date().toISOString(),
  };
  const database = getPool();
  if (database) {
    await database.execute('INSERT INTO locations (id, user_id, label, latitude, longitude, timezone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)', [record.id, record.user_id, record.label, record.latitude, record.longitude, record.timezone, record.is_default]);
    return { ...record, isDefault: record.is_default, createdAt: record.created_at };
  }
  if (record.is_default) {
    memoryStore.locations.filter((item) => item.user_id === userId).forEach((item) => { item.is_default = false; });
  }
  memoryStore.locations.push(record);
  return { ...record, isDefault: record.is_default, createdAt: record.created_at };
}

async function findLocationById(userId, locationId) {
  const database = getPool();
  if (database) {
    const [rows] = await database.query('SELECT id, label, latitude, longitude, timezone, is_default AS isDefault, created_at AS createdAt FROM locations WHERE id = ? AND user_id = ? LIMIT 1', [locationId, userId]);
    return rows[0] || null;
  }
  const loc = memoryStore.locations.find((location) => location.id === locationId && location.user_id === userId);
  return loc ? { ...loc, isDefault: loc.is_default, createdAt: loc.created_at } : null;
}

async function updateLocation(userId, locationId, updates) {
  const database = getPool();
  if (database) {
    const [rows] = await database.query('SELECT * FROM locations WHERE id = ? AND user_id = ? LIMIT 1', [locationId, userId]);
    if (rows.length === 0) return null;

    if (updates.isDefault) {
      await database.execute('UPDATE locations SET is_default = FALSE WHERE user_id = ?', [userId]);
    }

    const current = rows[0];
    const newLabel = updates.label !== undefined ? String(updates.label).trim() : current.label;
    const newLat = updates.latitude !== undefined ? Number(updates.latitude) : current.latitude;
    const newLon = updates.longitude !== undefined ? Number(updates.longitude) : current.longitude;
    const newTz = updates.timezone !== undefined ? String(updates.timezone) : current.timezone;
    const newDef = updates.isDefault !== undefined ? Boolean(updates.isDefault) : current.is_default;

    await database.execute(
      'UPDATE locations SET label = ?, latitude = ?, longitude = ?, timezone = ?, is_default = ? WHERE id = ? AND user_id = ?',
      [newLabel, newLat, newLon, newTz, newDef, locationId, userId]
    );

    const [updatedRows] = await database.query('SELECT id, label, latitude, longitude, timezone, is_default AS isDefault, created_at AS createdAt FROM locations WHERE id = ? AND user_id = ? LIMIT 1', [locationId, userId]);
    return updatedRows[0];
  }

  const index = memoryStore.locations.findIndex((location) => location.id === locationId && location.user_id === userId);
  if (index === -1) return null;

  if (updates.isDefault) {
    memoryStore.locations.filter((item) => item.user_id === userId).forEach((item) => { item.is_default = false; });
  }

  const loc = memoryStore.locations[index];
  if (updates.label !== undefined) loc.label = String(updates.label).trim();
  if (updates.latitude !== undefined) loc.latitude = Number(updates.latitude);
  if (updates.longitude !== undefined) loc.longitude = Number(updates.longitude);
  if (updates.timezone !== undefined) loc.timezone = String(updates.timezone);
  if (updates.isDefault !== undefined) loc.is_default = Boolean(updates.isDefault);

  return { ...loc, isDefault: loc.is_default, createdAt: loc.created_at };
}

async function deleteLocation(userId, locationId) {
  const database = getPool();
  if (database) {
    const [result] = await database.execute('DELETE FROM locations WHERE id = ? AND user_id = ?', [locationId, userId]);
    return result.affectedRows > 0;
  }
  const index = memoryStore.locations.findIndex((location) => location.id === locationId && location.user_id === userId);
  if (index === -1) return false;
  memoryStore.locations.splice(index, 1);
  return true;
}

async function listAlerts(userId, { locationId, activeOnly = true } = {}) {
  const database = getPool();
  if (database) {
    const conditions = ['l.user_id = ?'];
    const values = [userId];
    if (locationId) {
      conditions.push('a.location_id = ?');
      values.push(locationId);
    }
    if (activeOnly) conditions.push('a.is_active = TRUE');
    const [rows] = await database.query(`
      SELECT a.id, a.location_id AS locationId, a.alert_type AS alertType,
        a.severity, a.title, a.reason, a.valid_from AS validFrom,
        a.expires_at AS expiresAt, a.is_active AS isActive,
        a.created_at AS createdAt
      FROM alerts a
      INNER JOIN locations l ON l.id = a.location_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY FIELD(a.severity, 'high', 'medium', 'low'), a.created_at DESC
    `, values);
    return rows;
  }

  return memoryStore.alerts
    .filter((alert) => alert.user_id === userId)
    .filter((alert) => !locationId || alert.location_id === locationId)
    .filter((alert) => !activeOnly || alert.is_active)
    .sort((left, right) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return (severityOrder[left.severity] - severityOrder[right.severity]) || (new Date(right.created_at) - new Date(left.created_at));
    })
    .map((alert) => ({
      id: alert.id,
      locationId: alert.location_id,
      alertType: alert.alert_type,
      severity: alert.severity,
      title: alert.title,
      reason: alert.reason,
      validFrom: alert.valid_from,
      expiresAt: alert.expires_at,
      isActive: alert.is_active,
      createdAt: alert.created_at,
    }));
}

async function findAlertById(userId, alertId) {
  const alerts = await listAlerts(userId, { activeOnly: false });
  return alerts.find((alert) => alert.id === alertId) || null;
}

module.exports = {
  closeDatabase,
  createLocation,
  databaseConfigured,
  deleteLocation,
  initializeDatabase,
  listLocations,
  memoryStore,
  resetMemoryStore,
  findUserByEmail,
  findUserById,
  createUser,
  findAlertById,
  listAlerts,
  findLocationById,
  updateLocation,
};
