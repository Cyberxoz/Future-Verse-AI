const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const authenticate = require('../middleware/auth.middleware');

router.get('/summary', authenticate, financeController.getSummary);
router.put('/profile', authenticate, financeController.updateProfile);

module.exports = router;
