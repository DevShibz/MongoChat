const express = require('express');
const { verifyToken } = require('../middleware/auth');
const c = require('../controllers/conversationController');

const router = express.Router();

router.use(verifyToken);

router.get('/', c.listConversations);
router.post('/', c.createConversation);
router.get('/:id', c.getConversation);
router.get('/:id/messages', c.getMessages);
router.post('/:id/messages', c.sendMessage);
router.patch('/:id/read', c.markRead);

module.exports = router;
