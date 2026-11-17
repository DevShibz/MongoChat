const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { searchUsers } = require('../controllers/userController');

const router = express.Router();

router.get('/', verifyToken, searchUsers);

module.exports = router;
