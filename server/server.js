const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();

// CORS configuration supporting local dev and production
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Allow Render subdomains if deployed
    if (origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for API consumers
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-mode']
}));

// Body parsing middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter to /api
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api', apiRoutes);

// Serve static frontend files from 'dist'
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// SPA catch-all route: send dist/index.html for any GET requests not caught by static or /api
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  next();
});

// Centralized error handling
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`  🚀 FutureVerse AI Backend Server running!         `);
    console.log(`  🌐 Local URL: http://localhost:${config.port}     `);
    console.log(`  📊 Health check: http://localhost:${config.port}/api/health`);
    console.log(`  🤖 AI Coach API: http://localhost:${config.port}/api/ai/chat`);
    console.log(`  📁 Frontend served from: ${distPath}              `);
    console.log(`====================================================`);
  });
}

module.exports = app;
