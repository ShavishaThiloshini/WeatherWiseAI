const { randomUUID } = require('node:crypto');

const memoryStore = {
  users: [],
  locations: [],
};

function resetMemoryStore() {
  memoryStore.users = [];
  memoryStore.locations = [];
}

function findUserByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return memoryStore.users.find((user) => user.email === normalized) || null;
}

function findUserById(id) {
  return memoryStore.users.find((user) => user.id === id) || null;
}

function createUser({ name, email, passwordHash }) {
  const user = {
    id: randomUUID(),
    name: String(name || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    password_hash: passwordHash,
    passwordHash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryStore.users.push(user);
  return user;
}

module.exports = {
  memoryStore,
  resetMemoryStore,
  findUserByEmail,
  findUserById,
  createUser,
};
