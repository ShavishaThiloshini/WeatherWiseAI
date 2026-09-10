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
  findUserByEmail,
  findUserById,
  createUser,
  listLocationsByUserId,
  findLocationByIdForUser,
  createLocation,
  updateLocation,
  deleteLocation,
};
