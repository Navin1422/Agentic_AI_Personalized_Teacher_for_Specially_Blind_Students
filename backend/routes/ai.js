const express = require('express');
const router = express.Router();
const { chat, endSession } = require('../controllers/aiController');

// POST /api/ai/chat - Send message to AI teacher
router.post('/chat', chat);

// POST /api/ai/session-end - End and save session
router.post('/session-end', endSession);

module.exports = router;
