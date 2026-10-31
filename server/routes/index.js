const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const financeRoutes = require('./finance.routes');
const transactionsRoutes = require('./transactions.routes');
const goalsRoutes = require('./goals.routes');
const simulateRoutes = require('./simulate.routes');
const aiRoutes = require('./ai.routes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/finance', financeRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/goals', goalsRoutes);
router.use('/simulate', simulateRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
