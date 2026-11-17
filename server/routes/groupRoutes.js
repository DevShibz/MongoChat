const express = require('express');
const { verifyToken } = require('../middleware/auth');
const g = require('../controllers/groupController');

// Group messages use the conversation routes:
//   GET  /api/conversations/:groupId/messages
//   POST /api/conversations/:groupId/messages   (or socket "message:send")
//   PATCH /api/conversations/:groupId/read
const router = express.Router();

router.use(verifyToken);

router.get('/', g.listGroups);
router.post('/', g.createGroup);
router.get('/:id', g.getGroup);
router.patch('/:id', g.updateGroup);
router.post('/:id/members', g.addMembers);
router.delete('/:id/members/:userId', g.removeMember);
router.put('/:id/admins/:userId', g.makeAdmin);
router.delete('/:id/admins/:userId', g.removeAdmin);

module.exports = router;
