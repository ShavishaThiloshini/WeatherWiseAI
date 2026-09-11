const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
require('dotenv').config();
const mysql = require('mysql2/promise');

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? mysql.createPool(connectionString)
  : null;

const memoryUsers = global.__weatherwiseUsers || [];
global.__weatherwiseUsers = memoryUsers;
const memoryLocations = global.__weatherwiseLocations || [];
global.__weatherwiseLocations = memoryLocations;
const memoryPreferences = global.__weatherwisePreferences || [];
global.__weatherwisePreferences = memoryPreferences;
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

function loadSchemaStatements() {
  return fs
    .readFileSync(schemaPath, 'utf8')
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function initializeDatabase() {
  if (pool) {
    await pool.query('SELECT 1');
    for (const statement of loadSchemaStatements()) {
      await pool.query(statement);
    }
    return true;
  }

  global.__weatherwiseUsers = [];
  return true;
}

async function closeDatabase() {
  if (pool) await pool.end();
}

function resetMemoryStore() {
  memoryUsers.splice(0, memoryUsers.length);
  memoryLocations.splice(0, memoryLocations.length);
  memoryPreferences.splice(0, memoryPreferences.length);
}

async function query(sql, values) {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured');
  }

  return pool.query(sql, values);
}

async function checkDatabaseConnection() {
  await query('SELECT 1');
  return true;
}

async function findUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!pool) {
    return memoryUsers.find((user) => user.email === normalizedEmail) || null;
  }

  const [rows] = await query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
  return rows[0] || null;
}

async function findUserById(id) {
  if (!pool) {
    return memoryUsers.find((user) => user.id === Number(id)) || null;
  }

  const [rows] = await query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!pool) {
    const user = {
      id: memoryUsers.length ? Math.max(...memoryUsers.map((item) => Number(item.id || 0))) + 1 : 1,
      name: String(name),
      email: normalizedEmail,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };
    memoryUsers.push(user);
    return user;
  }

  const id = randomUUID();
  await query('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)', [
    id,
    String(name),
    normalizedEmail,
    passwordHash,
  ]);

  return {
    id,
    name: String(name),
    email: normalizedEmail,
    password_hash: passwordHash,
  };
}

async function updateUserName(userId, name) {
  if (!pool) {
    const user = memoryUsers.find((item) => String(item.id) === String(userId));
    if (!user) return null;
    user.name = name;
    return user;
  }

  await query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
  return findUserById(userId);
}

const DEFAULT_PREFERENCES = {
  cold_tolerance: 'medium',
  preferred_activity: null,
  preferred_activity_time: null,
  units: 'metric',
  notifications_enabled: true,
};

async function getUserPreferences(userId) {
  if (!pool) {
    return {
      user_id: userId,
      ...(memoryPreferences.find((item) => String(item.user_id) === String(userId)) || DEFAULT_PREFERENCES),
    };
  }

  const [rows] = await query(
    'SELECT cold_tolerance, preferred_activity, preferred_activity_time, units, notifications_enabled FROM user_preferences WHERE user_id = ?',
    [userId]
  );
  return { user_id: userId, ...(rows[0] || DEFAULT_PREFERENCES) };
}

async function updateUserPreferences(userId, preferences) {
  const current = await getUserPreferences(userId);
  const next = { ...current, ...preferences, user_id: userId };

  if (!pool) {
    const index = memoryPreferences.findIndex((item) => String(item.user_id) === String(userId));
    if (index === -1) memoryPreferences.push(next);
    else memoryPreferences[index] = next;
    return next;
  }

  await query(
    `INSERT INTO user_preferences
      (id, user_id, cold_tolerance, preferred_activity, preferred_activity_time, units, notifications_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        cold_tolerance = VALUES(cold_tolerance),
        preferred_activity = VALUES(preferred_activity),
        preferred_activity_time = VALUES(preferred_activity_time),
        units = VALUES(units),
        notifications_enabled = VALUES(notifications_enabled)`,
    [randomUUID(), userId, next.cold_tolerance, next.preferred_activity, next.preferred_activity_time, next.units, next.notifications_enabled]
  );
  return getUserPreferences(userId);
}

async function listLocationsByUserId(userId) {
  if (!pool) {
    return memoryLocations.filter((location) => String(location.user_id) === String(userId));
  }

  const [rows] = await query(
    'SELECT id, user_id, label, latitude, longitude, timezone, is_default, created_at FROM locations WHERE user_id = ? ORDER BY is_default DESC, created_at ASC',
    [userId]
  );
  return rows;
}

async function findLocationByIdForUser(locationId, userId) {
  if (!pool) {
    return memoryLocations.find(
      (location) => String(location.id) === String(locationId) && String(location.user_id) === String(userId)
    ) || null;
  }

  const [rows] = await query(
    'SELECT id, user_id, label, latitude, longitude, timezone, is_default, created_at FROM locations WHERE id = ? AND user_id = ?',
    [locationId, userId]
  );
  return rows[0] || null;
}

async function createLocation({ userId, label, latitude, longitude, timezone, isDefault }) {
  if (!pool) {
    if (isDefault) {
      memoryLocations
        .filter((location) => String(location.user_id) === String(userId))
        .forEach((location) => { location.is_default = false; });
    }

    const location = {
      id: memoryLocations.length
        ? Math.max(...memoryLocations.map((item) => Number(item.id || 0))) + 1
        : 1,
      user_id: userId,
      label,
      latitude,
      longitude,
      timezone,
      is_default: isDefault,
      created_at: new Date().toISOString(),
    };
    memoryLocations.push(location);
    return location;
  }

  const id = randomUUID();
  if (isDefault) {
    await query('UPDATE locations SET is_default = FALSE WHERE user_id = ?', [userId]);
  }
  await query(
    'INSERT INTO locations (id, user_id, label, latitude, longitude, timezone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, label, latitude, longitude, timezone, isDefault]
  );
  return findLocationByIdForUser(id, userId);
}

async function updateLocation({ locationId, userId, label, latitude, longitude, timezone, isDefault }) {
  if (!pool) {
    const location = await findLocationByIdForUser(locationId, userId);
    if (!location) return null;
    if (isDefault) {
      memoryLocations
        .filter((item) => String(item.user_id) === String(userId))
        .forEach((item) => { item.is_default = false; });
    }
    Object.assign(location, { label, latitude, longitude, timezone, is_default: isDefault });
    return location;
  }

  const location = await findLocationByIdForUser(locationId, userId);
  if (!location) return null;
  if (isDefault) {
    await query('UPDATE locations SET is_default = FALSE WHERE user_id = ?', [userId]);
  }
  await query(
    'UPDATE locations SET label = ?, latitude = ?, longitude = ?, timezone = ?, is_default = ? WHERE id = ? AND user_id = ?',
    [label, latitude, longitude, timezone, isDefault, locationId, userId]
  );
  return findLocationByIdForUser(locationId, userId);
}

async function deleteLocation(locationId, userId) {
  if (!pool) {
    const index = memoryLocations.findIndex(
      (location) => String(location.id) === String(locationId) && String(location.user_id) === String(userId)
    );
    if (index === -1) return false;
    memoryLocations.splice(index, 1);
    return true;
  }

  const [result] = await query('DELETE FROM locations WHERE id = ? AND user_id = ?', [locationId, userId]);
  return result.affectedRows === 1;
}

module.exports = {
  pool,
  query,
  checkDatabaseConnection,
  initializeDatabase,
  closeDatabase,
  resetMemoryStore,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserName,
  getUserPreferences,
  updateUserPreferences,
  listLocationsByUserId,
  findLocationByIdForUser,
  createLocation,
  updateLocation,
  deleteLocation,
};
