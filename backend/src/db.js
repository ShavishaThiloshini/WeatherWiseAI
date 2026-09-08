const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const mysql = require('mysql2/promise');

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? mysql.createPool(connectionString)
  : null;

const memoryUsers = global.__weatherwiseUsers || [];
global.__weatherwiseUsers = memoryUsers;
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
    for (const statement of loadSchemaStatements()) {
      await pool.query(statement);
    }
    return true;
  }

  global.__weatherwiseUsers = [];
  return true;
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

module.exports = {
  pool,
  query,
  checkDatabaseConnection,
  initializeDatabase,
  findUserByEmail,
  findUserById,
  createUser,
};
