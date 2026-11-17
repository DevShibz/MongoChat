// Socket event names. Keep in sync with client/src/lib/socketEvents.js
module.exports = {
  // client -> server
  MESSAGE_SEND: 'message:send', // ({ conversationId, content, messageType?, mediaUrl? }, ack)
  MESSAGE_READ: 'message:read', // ({ conversationId }, ack?)
  TYPING_START: 'typing:start', // ({ conversationId })
  TYPING_STOP: 'typing:stop', // ({ conversationId })

  // server -> client
  MESSAGE_NEW: 'message:new', // { message, isGroup }
  MESSAGES_READ: 'messages:read', // { conversationId, readerId }
  TYPING: 'typing', // { conversationId, userId, isTyping }
  PRESENCE_UPDATE: 'presence:update', // { userId, isOnline, lastSeen }
  GROUP_UPSERT: 'group:upsert', // { group }  created / renamed / members changed
  GROUP_REMOVED: 'group:removed', // { groupId }  you left or were removed
};
