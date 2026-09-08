const mysql = require('mysql2/promise');

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? mysql.createPool(connectionString)
  : null;

const memoryUsers = global.__weatherwiseUsers || [];
global.__weatherwiseUsers = memoryUsers;

async function initializeDatabase() {
  if (pool) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
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

  const [result] = await query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [
    String(name),
    normalizedEmail,
    passwordHash,
  ]);

  return {
    id: result.insertId,
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
