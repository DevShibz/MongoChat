const groupService = require('../services/groupService');
const emitters = require('../socket/emitters');

// Broadcasts the outcome of a group change to everyone affected.
function broadcast({ group, groupId, notice, participantIds, removedIds }) {
  if (group) emitters.emitGroupUpsert(participantIds, group);
  if (notice) emitters.emitNewMessage(participantIds, notice, true);
  if (removedIds.length) emitters.emitGroupRemoved(removedIds, groupId ?? group?._id);
}

// @route GET /api/groups
const listGroups = async (req, res) => {
  const groups = await groupService.listGroups(req.user._id);
  res.json({ success: true, groups });
};

// @route POST /api/groups   body: { name, description?, memberIds: [userId] }
const createGroup = async (req, res) => {
  const result = await groupService.createGroup(req.user._id, req.body);
  broadcast(result);
  res.status(201).json({ success: true, group: result.group });
};

// @route GET /api/groups/:id
const getGroup = async (req, res) => {
  const group = await groupService.getGroup(req.params.id, req.user._id);
  res.json({ success: true, group });
};

// @route PATCH /api/groups/:id   body: { name?, description?, avatar? }   (admin)
const updateGroup = async (req, res) => {
  const result = await groupService.updateGroup(req.params.id, req.user._id, req.body);
  broadcast(result);
  res.json({ success: true, group: result.group });
};

// @route POST /api/groups/:id/members   body: { userIds: [userId] }   (admin)
const addMembers = async (req, res) => {
  const result = await groupService.addMembers(req.params.id, req.user._id, req.body?.userIds);
  broadcast(result);
  res.json({ success: true, group: result.group });
};

// @route DELETE /api/groups/:id/members/:userId   (admin, or yourself to leave)
const removeMember = async (req, res) => {
  const result = await groupService.removeMember(req.params.id, req.user._id, req.params.userId);
  broadcast(result);
  res.json({ success: true, group: result.group });
};

// @route PUT|DELETE /api/groups/:id/admins/:userId   (admin)
const setAdmin = (makeAdmin) => async (req, res) => {
  const result = await groupService.setAdmin(req.params.id, req.user._id, req.params.userId, makeAdmin);
  broadcast(result);
  res.json({ success: true, group: result.group });
};

module.exports = {
  listGroups,
  createGroup,
  getGroup,
  updateGroup,
  addMembers,
  removeMember,
  makeAdmin: setAdmin(true),
  removeAdmin: setAdmin(false),
};
