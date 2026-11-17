const User = require('../../models/User');
const presence = require('../presence');
const { userRoom, emitPresence } = require('../emitters');

module.exports = function registerPresenceHandlers(io, socket) {
  const { userId } = socket.data;

  socket.join(userRoom(userId));

  if (presence.add(userId)) {
    User.updateOne({ _id: userId }, { isOnline: true }).catch(console.error);
    emitPresence(userId, true, null);
  }

  socket.on('disconnect', () => {
    if (presence.remove(userId)) {
      const lastSeen = new Date();
      User.updateOne({ _id: userId }, { isOnline: false, lastSeen }).catch(console.error);
      emitPresence(userId, false, lastSeen.toISOString());
    }
  });
};
