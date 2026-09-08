const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

function schemaText() {
  return fs.readFileSync(schemaPath, 'utf8');
}

test('Day 3 schema defines users, locations, ownership, and coordinate constraints', () => {
  const schema = schemaText();

  assert.match(schema, /CREATE TABLE IF NOT EXISTS users/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS locations/i);
  assert.match(schema, /FOREIGN KEY \(user_id\) REFERENCES users\(id\)/i);
  assert.match(schema, /CHECK \(latitude BETWEEN -90 AND 90\)/i);
  assert.match(schema, /CHECK \(longitude BETWEEN -180 AND 180\)/i);
  assert.match(schema, /INDEX idx_locations_user /i);
});

test('database initialization loads the schema in no-database development mode', async () => {
  const db = require('../src/db');
  assert.equal(await db.initializeDatabase(), true);
});

test('live MySQL schema initialization', { skip: !process.env.DATABASE_URL }, async () => {
  const db = require('../src/db');
  await db.initializeDatabase();

  const [tables] = await db.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN ('users', 'locations')`
  );

  assert.deepEqual(
    tables.map((table) => table.TABLE_NAME).sort(),
    ['locations', 'users']
  );
});
