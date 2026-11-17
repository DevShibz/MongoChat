const chatService = require('../services/chatService');

// @route GET /api/users?search=<text>
// Lists other users (to start a new chat).
const searchUsers = async (req, res) => {
  const users = await chatService.searchUsers(req.user._id, req.query.search);
  res.json({ success: true, users });
};

module.exports = { searchUsers };
