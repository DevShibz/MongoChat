const chatService = require('../services/chatService');
const emitters = require('../socket/emitters');

// Express 5 forwards rejected promises to the error middleware,
// so these handlers just throw (HttpError) on failure.

// @route GET /api/conversations
const listConversations = async (req, res) => {
  const conversations = await chatService.listConversations(req.user._id);
  res.json({ success: true, conversations });
};

// @route POST /api/conversations   body: { userId }
const createConversation = async (req, res) => {
  const { conversation, created } = await chatService.getOrCreateDirectConversation(
    req.user._id,
    req.body?.userId
  );
  res.status(created ? 201 : 200).json({ success: true, conversation });
};

// @route GET /api/conversations/:id
const getConversation = async (req, res) => {
  const conversation = await chatService.getConversation(req.params.id, req.user._id);
  res.json({ success: true, conversation });
};

// @route GET /api/conversations/:id/messages?before=<ISO date>&limit=50
const getMessages = async (req, res) => {
  const { messages, hasMore } = await chatService.getMessages(req.params.id, req.user._id, req.query);
  res.json({ success: true, messages, hasMore });
};

// @route POST /api/conversations/:id/messages   body: { content, messageType?, mediaUrl? }
// REST alternative to the socket "message:send" event; also broadcasts in realtime.
const sendMessage = async (req, res) => {
  const { content, messageType, mediaUrl } = req.body || {};
  const { message, participantIds, isGroup } = await chatService.createMessage({
    conversationId: req.params.id,
    senderId: req.user._id,
    content,
    messageType,
    mediaUrl,
  });
  emitters.emitNewMessage(participantIds, message, isGroup);
  res.status(201).json({ success: true, message });
};

// @route PATCH /api/conversations/:id/read
const markRead = async (req, res) => {
  const { modifiedCount, participantIds } = await chatService.markConversationRead(
    req.params.id,
    req.user._id
  );
  emitters.emitMessagesRead(participantIds, req.params.id, req.user._id);
  res.json({ success: true, modifiedCount });
};

module.exports = {
  listConversations,
  createConversation,
  getConversation,
  getMessages,
  sendMessage,
  markRead,
};
