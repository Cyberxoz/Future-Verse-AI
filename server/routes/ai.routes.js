const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authenticate = require('../middleware/auth.middleware');
const { aiChatLimiter } = require('../middleware/rateLimiter.middleware');
const { validateAiChat } = require('../middleware/validation.middleware');

router.post('/chat', authenticate, aiChatLimiter, validateAiChat, aiController.chat);
router.get('/history', authenticate, aiController.getHistory);
router.post('/clear', authenticate, aiController.clearHistory);

module.exports = router;
