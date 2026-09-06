const mysql = require('mysql2/promise');

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? mysql.createPool(connectionString)
  : null;

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

module.exports = { pool, query, checkDatabaseConnection };
