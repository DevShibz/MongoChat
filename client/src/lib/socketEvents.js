// Socket event names. Keep in sync with socket/events.js on the server.
export const EVENTS = {
  // client -> server
  MESSAGE_SEND: 'message:send',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // server -> client
  MESSAGE_NEW: 'message:new',
  MESSAGES_READ: 'messages:read',
  TYPING: 'typing',
  PRESENCE_UPDATE: 'presence:update',
  GROUP_UPSERT: 'group:upsert',
  GROUP_REMOVED: 'group:removed',
};
