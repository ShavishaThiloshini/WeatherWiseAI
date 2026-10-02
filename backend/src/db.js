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
  return memoryStore.locations
    .filter((location) => location.user_id === userId)
    .sort((left, right) => Number(right.is_default) - Number(left.is_default) || left.created_at.localeCompare(right.created_at))
    .map((location) => ({
      id: location.id,
      label: location.label,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
      isDefault: location.is_default,
      createdAt: location.created_at,
    }));
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
    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.query('SELECT id FROM locations WHERE user_id = ? LIMIT 1', [userId]);
      record.is_default = record.is_default || existing.length === 0;
      if (record.is_default) {
        await connection.execute('UPDATE locations SET is_default = FALSE WHERE user_id = ?', [userId]);
      }
      await connection.execute('INSERT INTO locations (id, user_id, label, latitude, longitude, timezone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)', [record.id, record.user_id, record.label, record.latitude, record.longitude, record.timezone, record.is_default]);
      await connection.commit();
      return { id: record.id, label: record.label, latitude: record.latitude, longitude: record.longitude, timezone: record.timezone, isDefault: record.is_default, createdAt: record.created_at };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  if (record.is_default || !memoryStore.locations.some((item) => item.user_id === userId)) {
    memoryStore.locations.filter((item) => item.user_id === userId).forEach((item) => { item.is_default = false; });
    record.is_default = true;
  }
  memoryStore.locations.push(record);
  return { id: record.id, label: record.label, latitude: record.latitude, longitude: record.longitude, timezone: record.timezone, isDefault: record.is_default, createdAt: record.created_at };
}

async function updateLocation(userId, locationId, updates) {
  const database = getPool();
  if (database) {
    if (updates.isDefault) {
      const connection = await database.getConnection();
      try {
        await connection.beginTransaction();
        const [locations] = await connection.query('SELECT id FROM locations WHERE id = ? AND user_id = ? LIMIT 1', [locationId, userId]);
        if (locations.length === 0) {
          await connection.rollback();
          return null;
        }
        await connection.execute('UPDATE locations SET is_default = FALSE WHERE user_id = ?', [userId]);
        if (updates.label !== undefined) {
          await connection.execute('UPDATE locations SET label = ?, is_default = TRUE WHERE id = ? AND user_id = ?', [updates.label, locationId, userId]);
        } else {
          await connection.execute('UPDATE locations SET is_default = TRUE WHERE id = ? AND user_id = ?', [locationId, userId]);
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else if (updates.label !== undefined) {
      const [result] = await database.execute('UPDATE locations SET label = ? WHERE id = ? AND user_id = ?', [updates.label, locationId, userId]);
      if (result.affectedRows === 0) {
        const [existing] = await database.query('SELECT id FROM locations WHERE id = ? AND user_id = ? LIMIT 1', [locationId, userId]);
        if (existing.length === 0) return null;
      }
    }
    const locations = await listLocations(userId);
    return locations.find((location) => String(location.id) === String(locationId)) || null;
  }

  const location = memoryStore.locations.find((item) => item.id === locationId && item.user_id === userId);
  if (!location) return null;
  if (updates.label !== undefined) location.label = updates.label;
  if (updates.isDefault) {
    memoryStore.locations
      .filter((item) => item.user_id === userId)
      .forEach((item) => { item.is_default = item.id === locationId; });
  }
  return {
    id: location.id,
    label: location.label,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
    isDefault: location.is_default,
    createdAt: location.created_at,
  };
}

async function deleteLocation(userId, locationId) {
  const database = getPool();
  if (database) {
    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();
      const [locations] = await connection.query('SELECT is_default AS isDefault FROM locations WHERE id = ? AND user_id = ? LIMIT 1', [locationId, userId]);
      if (locations.length === 0) {
        await connection.rollback();
        return false;
      }
      await connection.execute('DELETE FROM locations WHERE id = ? AND user_id = ?', [locationId, userId]);
      if (locations[0].isDefault) {
        const [remaining] = await connection.query('SELECT id FROM locations WHERE user_id = ? ORDER BY created_at ASC LIMIT 1', [userId]);
        if (remaining.length > 0) {
          await connection.execute('UPDATE locations SET is_default = TRUE WHERE id = ? AND user_id = ?', [remaining[0].id, userId]);
        }
      }
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  const index = memoryStore.locations.findIndex((location) => location.id === locationId && location.user_id === userId);
  if (index === -1) return false;
  const wasDefault = memoryStore.locations[index].is_default;
  memoryStore.locations.splice(index, 1);
  if (wasDefault) {
    const nextDefault = memoryStore.locations
      .filter((location) => location.user_id === userId)
      .sort((left, right) => left.created_at.localeCompare(right.created_at))[0];
    if (nextDefault) nextDefault.is_default = true;
  }
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
  updateLocation,
  initializeDatabase,
  listLocations,
  memoryStore,
  resetMemoryStore,
  findUserByEmail,
  findUserById,
  createUser,
  findAlertById,
  listAlerts,
};
