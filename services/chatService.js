/**
 * Chat business logic, shared by the REST controllers and the socket handlers.
 * Nothing in here knows about HTTP or Socket.IO.
 */
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const HttpError = require('../utils/HttpError');
const presence = require('../socket/presence');

const PUBLIC_USER_FIELDS = 'username email avatar about isOnline lastSeen';
const MAX_PAGE_SIZE = 100;

const toId = (v) => String(v?._id ?? v);

function assertObjectId(id, label = 'id') {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, `Invalid ${label}.`);
  }
}

// Shape a populated conversation for one viewer:
// adds `otherUser` (for 1:1 chats) and `unread` (the viewer's unread count).
function formatConversation(conv, viewerId) {
  const viewer = toId(viewerId);
  const counts = conv.unreadCounts instanceof Map
    ? Object.fromEntries(conv.unreadCounts)
    : conv.unreadCounts || {};
  return {
    ...conv,
    unreadCounts: counts,
    otherUser: conv.isGroup ? null : conv.participants.find((p) => toId(p) !== viewer) || null,
    unread: counts[viewer] || 0,
  };
}

async function findPopulatedConversation(conversationId) {
  return Conversation.findById(conversationId)
    .populate('participants', PUBLIC_USER_FIELDS)
    .populate('lastMessage')
    .lean();
}

// Loads a conversation and checks the user is in it.
async function getConversationForUser(conversationId, userId) {
  assertObjectId(conversationId, 'conversation id');
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) throw new HttpError(404, 'Conversation not found.');
  if (!conv.participants.some((p) => toId(p) === toId(userId))) {
    throw new HttpError(403, 'You are not part of this conversation.');
  }
  return conv;
}

// 1:1 chats by default; pass { isGroup: true } for groups.
async function listConversations(userId, { isGroup = false } = {}) {
  const convs = await Conversation.find({ participants: userId, isGroup })
    .populate('participants', PUBLIC_USER_FIELDS)
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .lean();
  return convs.map((c) => formatConversation(c, userId));
}

async function getConversation(conversationId, userId) {
  await getConversationForUser(conversationId, userId);
  return formatConversation(await findPopulatedConversation(conversationId), userId);
}

// Finds the 1:1 conversation between two users, creating it if needed.
async function getOrCreateDirectConversation(userId, otherUserId) {
  assertObjectId(otherUserId, 'user id');
  if (toId(userId) === toId(otherUserId)) {
    throw new HttpError(400, 'You cannot start a conversation with yourself.');
  }
  const other = await User.exists({ _id: otherUserId });
  if (!other) throw new HttpError(404, 'User not found.');

  let conv = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [userId, otherUserId], $size: 2 },
  }).lean();

  let created = false;
  if (!conv) {
    conv = await Conversation.create({
      participants: [userId, otherUserId],
      unreadCounts: { [toId(userId)]: 0, [toId(otherUserId)]: 0 },
    });
    created = true;
  }
  const populated = await findPopulatedConversation(conv._id);
  return { conversation: formatConversation(populated, userId), created };
}

// Newest-last page of messages. Pass `before` (ISO date) to load older ones.
async function getMessages(conversationId, userId, { before, limit = 50 } = {}) {
  await getConversationForUser(conversationId, userId);
  const size = Math.min(Math.max(parseInt(limit, 10) || 50, 1), MAX_PAGE_SIZE);
  const filter = { conversationId };
  if (before) {
    const date = new Date(before);
    if (Number.isNaN(date.getTime())) throw new HttpError(400, 'Invalid "before" date.');
    filter.createdAt = { $lt: date };
  }
  const page = await Message.find(filter).sort({ createdAt: -1 }).limit(size + 1).lean();
  const hasMore = page.length > size;
  return { messages: page.slice(0, size).reverse(), hasMore };
}

// Creates a user message. System messages are only created server-side (createSystemMessage).
async function createMessage({ conversationId, senderId, content, messageType = 'text', mediaUrl = null }) {
  if (messageType === 'system') throw new HttpError(400, 'Invalid message type.');
  const conv = await getConversationForUser(conversationId, senderId);
  const others = conv.participants.map(toId).filter((id) => id !== toId(senderId));

  const message = await Message.create({
    conversationId,
    sender: senderId,
    content: typeof content === 'string' ? content : undefined,
    messageType,
    mediaUrl,
    status: others.some((id) => presence.isOnline(id)) ? 'delivered' : 'sent',
  });

  const inc = Object.fromEntries(others.map((id) => [`unreadCounts.${id}`, 1]));
  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { lastMessage: message._id }, $inc: inc }
  );

  return {
    message: message.toObject(),
    participantIds: conv.participants.map(toId),
    isGroup: !!conv.isGroup,
  };
}

// Group notices ("alex added emily"). Becomes the last message but doesn't count as unread.
async function createSystemMessage(conversationId, actorId, content) {
  const message = await Message.create({
    conversationId,
    sender: actorId,
    content,
    messageType: 'system',
    status: 'read',
  });
  await Conversation.updateOne({ _id: conversationId }, { $set: { lastMessage: message._id } });
  return message.toObject();
}

// Marks every message the user received in a conversation as read.
async function markConversationRead(conversationId, userId) {
  const conv = await getConversationForUser(conversationId, userId);
  const { modifiedCount } = await Message.updateMany(
    { conversationId, sender: { $ne: userId }, readBy: { $ne: userId }, messageType: { $ne: 'system' } },
    { $addToSet: { readBy: userId } }
  );
  // A message is 'read' once every other participant has read it
  // (1:1 -> the other person; group -> all other members).
  if (modifiedCount) {
    await Message.updateMany(
      {
        conversationId,
        status: { $ne: 'read' },
        $expr: { $gte: [{ $size: '$readBy' }, conv.participants.length - 1] },
      },
      { $set: { status: 'read' } }
    );
  }
  // timestamps: false so reading doesn't bump the chat to the top of the list
  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { [`unreadCounts.${toId(userId)}`]: 0 } },
    { timestamps: false }
  );
  return { modifiedCount, participantIds: conv.participants.map(toId) };
}

async function searchUsers(userId, search = '') {
  const filter = { _id: { $ne: userId } };
  const term = String(search).trim();
  if (term) {
    const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ username: rx }, { email: rx }];
  }
  return User.find(filter).select(PUBLIC_USER_FIELDS).sort({ username: 1 }).limit(20).lean();
}

module.exports = {
  PUBLIC_USER_FIELDS,
  toId,
  assertObjectId,
  formatConversation,
  findPopulatedConversation,
  createSystemMessage,
  getConversationForUser,
  listConversations,
  getConversation,
  getOrCreateDirectConversation,
  getMessages,
  createMessage,
  markConversationRead,
  searchUsers,
};
