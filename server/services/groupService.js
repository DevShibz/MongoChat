/**
 * Group business logic. Groups are Conversations with isGroup: true, so sending,
 * reading and paginating messages reuse chatService and the /conversations routes.
 *
 * Every mutation returns { group, notice, participantIds, removedIds } so callers
 * (REST controller) can broadcast the change in realtime.
 */
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const HttpError = require('../utils/HttpError');
const chat = require('./chatService');

const { toId } = chat;
const MAX_MEMBERS = 256;

async function getGroupForUser(groupId, userId) {
  const conv = await chat.getConversationForUser(groupId, userId);
  if (!conv.isGroup) throw new HttpError(404, 'Group not found.');
  return conv;
}

const isAdmin = (group, userId) => (group.admins || []).some((a) => toId(a) === toId(userId));

function assertAdmin(group, userId) {
  if (!isAdmin(group, userId)) throw new HttpError(403, 'Only group admins can do that.');
}

async function loadGroup(groupId, viewerId) {
  return chat.formatConversation(await chat.findPopulatedConversation(groupId), viewerId);
}

// Validates and de-duplicates user ids; returns the users that exist.
async function resolveUsers(ids) {
  if (!Array.isArray(ids)) throw new HttpError(400, 'memberIds must be an array of user ids.');
  const unique = [...new Set(ids.map(String))];
  unique.forEach((id) => chat.assertObjectId(id, 'user id'));
  const users = await User.find({ _id: { $in: unique } }).select('username').lean();
  if (users.length !== unique.length) throw new HttpError(404, 'One or more users were not found.');
  return users;
}

const usernameOf = async (userId) => (await User.findById(userId).select('username').lean())?.username || 'someone';
const nameList = (users) => users.map((u) => u.username).join(', ');

async function listGroups(userId) {
  return chat.listConversations(userId, { isGroup: true });
}

async function getGroup(groupId, userId) {
  await getGroupForUser(groupId, userId);
  return loadGroup(groupId, userId);
}

async function createGroup(userId, { name, description = '', memberIds = [] } = {}) {
  if (!name || !String(name).trim()) throw new HttpError(400, 'Group name is required.');
  const members = (await resolveUsers(memberIds)).filter((u) => toId(u) !== toId(userId));
  if (!members.length) throw new HttpError(400, 'Add at least one other member.');
  if (members.length + 1 > MAX_MEMBERS) throw new HttpError(400, `A group can have at most ${MAX_MEMBERS} members.`);

  const participants = [toId(userId), ...members.map(toId)];
  const group = await Conversation.create({
    isGroup: true,
    name,
    description,
    participants,
    admins: [userId],
    createdBy: userId,
    unreadCounts: Object.fromEntries(participants.map((id) => [id, 0])),
  });

  const notice = await chat.createSystemMessage(
    group._id,
    userId,
    `${await usernameOf(userId)} created group "${group.name}"`
  );
  return { group: await loadGroup(group._id, userId), notice, participantIds: participants, removedIds: [] };
}

async function updateGroup(groupId, userId, { name, description, avatar } = {}) {
  const group = await getGroupForUser(groupId, userId);
  assertAdmin(group, userId);

  const $set = {};
  if (name !== undefined) {
    if (!String(name).trim()) throw new HttpError(400, 'Group name cannot be empty.');
    $set.name = name;
  }
  if (description !== undefined) $set.description = description;
  if (avatar !== undefined) $set.avatar = avatar;
  if (!Object.keys($set).length) throw new HttpError(400, 'Nothing to update.');

  await Conversation.updateOne({ _id: groupId }, { $set }, { runValidators: true });

  const actor = await usernameOf(userId);
  const changes = [];
  if ($set.name !== undefined && $set.name.trim() !== group.name) changes.push(`changed the group name to "${$set.name.trim()}"`);
  if ($set.description !== undefined && $set.description.trim() !== (group.description || '')) changes.push('changed the group description');
  const notice = changes.length ? await chat.createSystemMessage(groupId, userId, `${actor} ${changes.join(' and ')}`) : null;

  return {
    group: await loadGroup(groupId, userId),
    notice,
    participantIds: group.participants.map(toId),
    removedIds: [],
  };
}

async function addMembers(groupId, userId, userIds) {
  const group = await getGroupForUser(groupId, userId);
  assertAdmin(group, userId);

  const current = new Set(group.participants.map(toId));
  const newUsers = (await resolveUsers(userIds)).filter((u) => !current.has(toId(u)));
  if (!newUsers.length) throw new HttpError(400, 'Those users are already in the group.');
  if (current.size + newUsers.length > MAX_MEMBERS) {
    throw new HttpError(400, `A group can have at most ${MAX_MEMBERS} members.`);
  }

  const newIds = newUsers.map(toId);
  await Conversation.updateOne(
    { _id: groupId },
    {
      $addToSet: { participants: { $each: newIds } },
      $set: Object.fromEntries(newIds.map((id) => [`unreadCounts.${id}`, 0])),
    }
  );

  const notice = await chat.createSystemMessage(
    groupId,
    userId,
    `${await usernameOf(userId)} added ${nameList(newUsers)}`
  );
  return {
    group: await loadGroup(groupId, userId),
    notice,
    participantIds: [...current, ...newIds],
    removedIds: [],
  };
}

// Admin removes someone, or a member removes themself (= leave).
async function removeMember(groupId, actorId, targetId) {
  chat.assertObjectId(targetId, 'user id');
  const group = await getGroupForUser(groupId, actorId);
  const leaving = toId(actorId) === toId(targetId);
  if (!leaving) assertAdmin(group, actorId);
  if (!group.participants.some((p) => toId(p) === toId(targetId))) {
    throw new HttpError(404, 'That user is not in the group.');
  }

  const remaining = group.participants.map(toId).filter((id) => id !== toId(targetId));

  // Last member left -> delete the group and its messages
  if (!remaining.length) {
    await Message.deleteMany({ conversationId: groupId });
    await Conversation.deleteOne({ _id: groupId });
    return { group: null, groupId: toId(groupId), notice: null, participantIds: [], removedIds: [toId(targetId)] };
  }

  let admins = (group.admins || []).map(toId).filter((id) => id !== toId(targetId));
  if (!admins.length) admins = [remaining[0]]; // keep at least one admin

  await Conversation.updateOne(
    { _id: groupId },
    {
      $set: { participants: remaining, admins },
      $unset: { [`unreadCounts.${toId(targetId)}`]: '' },
    }
  );

  const actor = await usernameOf(actorId);
  const text = leaving ? `${actor} left` : `${actor} removed ${await usernameOf(targetId)}`;
  const notice = await chat.createSystemMessage(groupId, actorId, text);

  return {
    group: await loadGroup(groupId, remaining[0]),
    groupId: toId(groupId),
    notice,
    participantIds: remaining,
    removedIds: [toId(targetId)],
  };
}

async function setAdmin(groupId, actorId, targetId, makeAdmin) {
  chat.assertObjectId(targetId, 'user id');
  const group = await getGroupForUser(groupId, actorId);
  assertAdmin(group, actorId);
  if (!group.participants.some((p) => toId(p) === toId(targetId))) {
    throw new HttpError(404, 'That user is not in the group.');
  }
  if (!makeAdmin && (group.admins || []).length <= 1 && isAdmin(group, targetId)) {
    throw new HttpError(400, 'A group needs at least one admin.');
  }

  await Conversation.updateOne(
    { _id: groupId },
    makeAdmin ? { $addToSet: { admins: targetId } } : { $pull: { admins: targetId } }
  );
  return {
    group: await loadGroup(groupId, actorId),
    notice: null,
    participantIds: group.participants.map(toId),
    removedIds: [],
  };
}

module.exports = {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  addMembers,
  removeMember,
  setAdmin,
};
