const rateLimit = require('express-rate-limit');

// Standard API rate limiter (15 minutes, 150 requests per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Stricter rate limiter for AI Chat requests (1 minute, 30 requests per IP)
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI rate limit reached. Please wait a moment before sending another message.'
  }
});

module.exports = {
  apiLimiter,
  aiChatLimiter
};
