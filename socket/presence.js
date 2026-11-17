// In-memory count of open sockets per user (a user can have several tabs).
// Single-process only; swap for Redis if you run more than one server.
const connections = new Map();

function add(userId) {
  const id = String(userId);
  const count = (connections.get(id) || 0) + 1;
  connections.set(id, count);
  return count === 1; // true = user just came online
}

function remove(userId) {
  const id = String(userId);
  const count = (connections.get(id) || 1) - 1;
  if (count <= 0) {
    connections.delete(id);
    return true; // true = user just went offline
  }
  connections.set(id, count);
  return false;
}

const isOnline = (userId) => connections.has(String(userId));

module.exports = { add, remove, isOnline };
