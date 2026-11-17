/**
 * Server -> client broadcasts. Used by both REST controllers and socket handlers.
 * Every socket joins a personal room `user:<id>`, so emitting to a user reaches
 * all of their open tabs/devices.
 */
const EVENTS = require('./events');

let io = null;

const setIO = (instance) => {
  io = instance;
};

const userRoom = (userId) => `user:${userId}`;

function emitToUsers(userIds, event, payload) {
  if (!io || !userIds.length) return;
  io.to(userIds.map((id) => userRoom(String(id)))).emit(event, payload);
}

const emitNewMessage = (participantIds, message, isGroup = false) =>
  emitToUsers(participantIds, EVENTS.MESSAGE_NEW, { message, isGroup });

// Group payload is viewer-neutral; clients keep their own unread count.
const emitGroupUpsert = (participantIds, group) => {
  const { unread, otherUser, ...shared } = group;
  emitToUsers(participantIds, EVENTS.GROUP_UPSERT, { group: shared });
};

const emitGroupRemoved = (userIds, groupId) =>
  emitToUsers(userIds, EVENTS.GROUP_REMOVED, { groupId: String(groupId) });

const emitMessagesRead = (participantIds, conversationId, readerId) =>
  emitToUsers(participantIds, EVENTS.MESSAGES_READ, {
    conversationId: String(conversationId),
    readerId: String(readerId),
  });

const emitTyping = (userIds, conversationId, userId, isTyping) =>
  emitToUsers(userIds, EVENTS.TYPING, {
    conversationId: String(conversationId),
    userId: String(userId),
    isTyping,
  });

function emitPresence(userId, isOnline, lastSeen) {
  if (!io) return;
  io.emit(EVENTS.PRESENCE_UPDATE, { userId: String(userId), isOnline, lastSeen });
}

module.exports = {
  setIO,
  userRoom,
  emitToUsers,
  emitNewMessage,
  emitGroupUpsert,
  emitGroupRemoved,
  emitMessagesRead,
  emitTyping,
  emitPresence,
};
