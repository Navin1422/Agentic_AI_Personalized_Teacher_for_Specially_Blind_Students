const express = require('express');
const router = express.Router();
const { chat, endSession, logInteraction } = require('../controllers/aiController');

// POST /api/ai/chat - Send message to AI teacher
router.post('/chat', chat);

// POST /api/ai/session-end - End and save session
router.post('/session-end', endSession);

// POST /api/ai/log - Log Brixbee desktop interactions
router.post('/log', logInteraction);

module.exports = router;
