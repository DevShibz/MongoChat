const EVENTS = require('../events');
const chatService = require('../../services/chatService');
const emitters = require('../emitters');

// Wraps an async handler: replies through the ack callback (if the client sent one)
// with { ok: true, ...result } or { ok: false, error }.
const withAck = (handler) => async (payload, ack) => {
  const reply = typeof ack === 'function' ? ack : () => {};
  try {
    const result = await handler(payload || {});
    reply({ ok: true, ...result });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0];
      return reply({ ok: false, error: first?.message || 'Invalid data' });
    }
    if (!err.status) console.error('Socket handler error:', err);
    reply({ ok: false, error: err.status ? err.message : 'Server error' });
  }
};

module.exports = function registerChatHandlers(io, socket) {
  const { userId } = socket.data;

  socket.on(
    EVENTS.MESSAGE_SEND,
    withAck(async ({ conversationId, content, messageType, mediaUrl }) => {
      const { message, participantIds, isGroup } = await chatService.createMessage({
        conversationId,
        senderId: userId,
        content,
        messageType,
        mediaUrl,
      });
      emitters.emitNewMessage(participantIds, message, isGroup);
      typingIn.delete(String(conversationId));
      emitters.emitTyping(participantIds.filter((id) => id !== userId), conversationId, userId, false);
      return { message };
    })
  );

  socket.on(
    EVENTS.MESSAGE_READ,
    withAck(async ({ conversationId }) => {
      const { modifiedCount, participantIds } = await chatService.markConversationRead(conversationId, userId);
      emitters.emitMessagesRead(participantIds, conversationId, userId);
      return { modifiedCount };
    })
  );

  // Typing indicator. Clients resend typing:start every few seconds while typing
  // and receivers expire it on their own, so a lost "stop" can't stick forever.
  const typingIn = new Set(); // conversation ids this socket is currently typing in

  const typing = (isTyping) =>
    withAck(async ({ conversationId }) => {
      const conv = await chatService.getConversationForUser(conversationId, userId);
      const others = conv.participants.map(String).filter((id) => id !== userId);
      if (isTyping) typingIn.add(String(conversationId));
      else typingIn.delete(String(conversationId));
      emitters.emitTyping(others, conversationId, userId, isTyping);
      return {};
    });

  socket.on(EVENTS.TYPING_START, typing(true));
  socket.on(EVENTS.TYPING_STOP, typing(false));

  // Closed the tab mid-typing -> tell the others to stop showing it.
  socket.on('disconnect', () => {
    for (const conversationId of typingIn) {
      chatService
        .getConversationForUser(conversationId, userId)
        .then((conv) => {
          const others = conv.participants.map(String).filter((id) => id !== userId);
          emitters.emitTyping(others, conversationId, userId, false);
        })
        .catch(() => {});
    }
    typingIn.clear();
  });
};
